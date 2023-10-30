import type { Actions, ServerLoad, ServerLoadEvent } from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils";
import { error, fail } from "@sveltejs/kit";
import { wait } from "$lib/utils";
import Tesseract from "tesseract.js";
import { env } from "$env/dynamic/private";
import { DateTime } from "luxon";
import type { TimeOverride, TimeOverrides } from "$lib/oldHistory";
import { dev } from "$app/environment";

let nextIndex = 0;
let currentShow: HistoricalEntry | undefined = undefined;

let downloadingPromise: Promise<object> | undefined = undefined;

let processingPromise: Promise<object> | undefined = undefined;

let imageIndex = 1;

const tesseractWorker = await Tesseract.createWorker();
(async () => {
  await tesseractWorker.loadLanguage("eng");
  await tesseractWorker.initialize("eng");
})();

let verifyImageText: {
  imagePath: string,
  text: Promise<string>
} | undefined = undefined

export const load = (async ({fetch}) => {

  const {download, process} = dev ? await import("../../scripts/time-extractor/time-extractor") : {download: undefined, process: undefined};

  if(!download || !process) throw new Error();

  if(typeof verifyImageText != "undefined") {
    const isDoneFetching = typeof (await Promise.any([verifyImageText.text, wait(5)])) === "string";
    return {
      image: {
        path: verifyImageText.imagePath,
        promptText: false,
        verifyText: true,
        text: isDoneFetching ? await verifyImageText.text : undefined
      },
      show: currentShow
    }
  }

  const oldShows = await fetch("/api/oldShows").then(r => r.json()) as HistoricalEntry[];

  let videoId = currentShow?.metadata?.vods?.youtube;
  if(typeof currentShow === "undefined") {
    while(!videoId) {
      currentShow = oldShows[nextIndex];
      const existingOverrides = JSON.parse(await (dev ? ((await import("fs")).promises) : undefined)?.readFile("src/scripts/time-extractor/time-overrides.json", {encoding: "utf8"}) ?? "") as TimeOverrides;
      if(!currentShow?.metadata?.mainShowStart && currentShow?.metadata?.mainShowLength && !Object.keys(existingOverrides).includes(currentShow.name)) {
        videoId = currentShow.metadata.vods?.youtube;
      }
      nextIndex++;
      console.log({videoId, nextIndex})
      if(nextIndex > oldShows.length) {
        break;
      }
    }
    if(nextIndex > oldShows.length) {
      return {done: true}
    }
  }
  if(!videoId) {
    throw error(500, "Missing video id!");
  }
  if(typeof downloadingPromise === "undefined") {
    console.log("starting download")
    downloadingPromise = download(videoId);
    downloadingPromise.catch(e => {
      console.log(e);
      reset();
    });
  }

  const isDoneDownloading = !!await Promise.any([downloadingPromise, wait(5)]);

  if(!isDoneDownloading) {
    return {
      downloading: true,
      show: currentShow
    }
  }

  if(typeof processingPromise === "undefined") {
    processingPromise = process(videoId);
    processingPromise.catch(e => {
      console.log(e);
      reset();
    })
  }

  const isDoneProcessing = !!await Promise.any([processingPromise, wait(5)]);

  if(!isDoneProcessing) {
    return {
      processing: true,
      show: currentShow
    }
  }

  const {fileExists} = dev ? await import("../../scripts/old-history-generator/utils") : {fileExists: undefined};
  if(!fileExists) throw new Error();

  let imageLength = 0;
  for (let i = 50; i < 1000; i++) {
    const path = `time-extracting/${videoId}/screenshots/img${i}.jpg`;
    if(!await fileExists("static/" + path)) {
      imageLength = i-1;
      break;
    }
  }

  let foundPossible = false;
  let path;
  while(!foundPossible) {
    path = `time-extracting/${videoId}/screenshots/img${imageIndex}.jpg`;
    if(!await fileExists("static/" + path)) {
      reset();
      return {};
    }
    const text = await tesseractWorker.recognize("static/" + path)
      .then(r => r.data.text);
    const strippedText = text
      .replaceAll("\n", "")
      .replaceAll(/\s/g, "")

    if(
      (
        strippedText.length > 4 ||
        ((text.includes("A") || text.includes("P") || text.includes("M")) && strippedText.length > 2)
      ) && !(text.includes("uo") && text.includes("L"))
    ) {
      console.log({text})
      foundPossible = true;
      break;
    }

    imageIndex++;
  }

  return {
    image: {
      path: path,
      promptText: true,
      length: imageLength
    },
    show: currentShow
  }

}) satisfies ServerLoad;

export const actions = {
  skipShow: () => {
    reset();
  },

  noTime: () => {
    imageIndex++
  },
  hasTime: async ({fetch}) => {
    const data = await load({fetch} as unknown as ServerLoadEvent);
    const imagePath = `time-extracting/${data.show?.metadata.vods?.youtube}/screenshots/img${imageIndex}.jpg`;
    const imageBase64 = await (dev ? ((await import("fs")).promises) : undefined)?.readFile("static/" + imagePath, {encoding: "base64"});
    startGoogleOCR(imagePath, imageBase64 ?? "")
  },
  selectImage: async ({fetch, url}) => {
    const image = Number(url.searchParams.get("image"));
    const data = await load({fetch} as unknown as ServerLoadEvent);
    const imagePath = `time-extracting/${data.show?.metadata.vods?.youtube}/screenshots/img${image}.jpg`;
    const imageBase64 = await (dev ? ((await import("fs")).promises) : undefined)?.readFile("static/" + imagePath, {encoding: "base64"});
    startGoogleOCR(imagePath, imageBase64 ?? "")
  },

  correctTime: async ({fetch}) => {
    if(!verifyImageText) return fail(400, {message: "Invalid state!"});
    const data = await load({fetch} as unknown as ServerLoadEvent);

    const text = await verifyImageText.text;
    const textParts = text.split(" ")[0].split(":")

    if(!data.show) return fail(500, {message: "Unable to find show!"});

    const showDateParts = data.show.name.split("/");
    const timeInImage = DateTime.fromObject(
      {
        year: Number(showDateParts[0]),
        month: Number(showDateParts[1]),
        day: Number(showDateParts[2]),
        hour: Number(textParts[0]) + 12,
        minute: Number(textParts[1])
      }, {
        zone: "America/Vancouver"
      }
    );

    const timeAtStart = timeInImage.minus({minute: imageIndex});
    const timeAtEnd = timeAtStart.plus({millisecond: data.show.metadata.mainShowLength});

    const mainShowStart = timeAtStart.toISO();
    const showEnd = timeAtEnd.toISO();

    if(mainShowStart == null) {
      console.log({showDateParts, textParts, timeInImage, timeAtStart, mainShowStart})
      return fail(500, {message: "Invalid show start time!"})
    }
    if(showEnd == null) {
      console.log({showDateParts, textParts, timeInImage, timeAtEnd, showEnd})
      return fail(500, {message: "Invalid show end time!"})
    }

    await saveNewTime(data.show.name, {
      mainShowStart,
      showEnd
    });
    reset();

  },

  adjustTime: async ({fetch, request}) => {
    if(!verifyImageText) return fail(400, {message: "Invalid state!"});
    const data = await load({fetch} as unknown as ServerLoadEvent);

    const requestData = await request.formData();
    const text = requestData.get("adjustedTime") as string;
    const textParts = text.split(" ")[0].split(":")

    if(!data.show) return fail(500, {message: "Unable to find show!"});

    const showDateParts = data.show.name.split("/");
    const timeInImage = DateTime.fromObject(
      {
        year: Number(showDateParts[0]),
        month: Number(showDateParts[1]),
        day: Number(showDateParts[2]),
        hour: Number(textParts[0]) + 12,
        minute: Number(textParts[1])
      }, {
        zone: "America/Vancouver"
      }
    );

    const timeAtStart = timeInImage.minus({minute: imageIndex/2});
    const timeAtEnd = timeAtStart.plus({millisecond: data.show.metadata.mainShowLength});

    const mainShowStart = timeAtStart.toISO();
    const showEnd = timeAtEnd.toISO();

    if(mainShowStart == null) {
      console.log({showDateParts, textParts, timeInImage, timeAtStart, mainShowStart})
      return fail(500, {message: "Invalid show start time!"})
    }
    if(showEnd == null) {
      console.log({showDateParts, textParts, timeInImage, timeAtEnd, showEnd})
      return fail(500, {message: "Invalid show end time!"})
    }

    await saveNewTime(data.show.name, {
      mainShowStart,
      showEnd
    });
    reset();

  }
} satisfies Actions;

function startGoogleOCR(imagePath: string, imageBase64: string) {
  verifyImageText = {
    imagePath,
    text: fetch("https://vision.googleapis.com/v1/images:annotate?key=" + env.YOUTUBE_KEY, {
      method: "POST",
      body: JSON.stringify(
        {
          requests: [
            {
              image: {
                content: imageBase64
              },
              features: [
                {
                  "type": "TEXT_DETECTION"
                }
              ]
            }
          ]
        }
      )
    })
      .then(r => r.json())
      .then(r => {console.log(r); return r;})
      .then(r => {
        if(r.responses.length < 1 || !r.responses[0].textAnnotations || r.responses[0].textAnnotations.length < 1) {
          console.log("No text from google ocr. returning empty string")
          return "";
        }
        const lines = r.responses[0].textAnnotations[0].description.split("\n");
        for (const line of lines) {
          if(line.includes("PM") || line.includes("AM")) {
            return line;
          }
        }
        return r.responses[0].textAnnotations[0].description;
      })
  }
}

async function saveNewTime(show: string, timeOverride: TimeOverride) {
  const fs = dev ? ((await import("fs")).promises) : undefined;
  if(!fs) throw new Error();
  const file = "src/scripts/time-extractor/time-overrides.json";
  const data = JSON.parse(await fs.readFile(file, {encoding: "utf8"})) as TimeOverrides;
  data[show] = timeOverride;
  await fs.writeFile(file, JSON.stringify(data, undefined, '\t'))
}

function reset() {
  currentShow = undefined;
  downloadingPromise = undefined;
  processingPromise = undefined;
  imageIndex = 1;
  verifyImageText = undefined;
}