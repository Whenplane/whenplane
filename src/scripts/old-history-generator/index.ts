// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fetchFloatplaneShows} from "./floatplane-fetcher.ts";
import type {FloatplanePost} from "../../lib/utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fileExists} from "./utils.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fetchYoutubeShows, SpecificData} from "./youtube-fetcher.ts";

import 'dotenv/config'
import type { HistoricalEntry, YoutubeThumbnail } from "../../lib/utils";
import fs from "node:fs/promises";
import { Duration } from "luxon";
import sharp from "sharp";
import { encode } from "blurhash";
import { wait } from "../../lib/utils.ts";

const imageUrlToBase64 = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.arrayBuffer();
    return Buffer.from(blob).toString('base64');
};

export const floatplaneDataPath = "src/scripts/old-history-generator/floatplane-wan-vods.json"
export const youtubeDataPath = "src/scripts/old-history-generator/youtube-wan-vods.json";
export const outputDataPath = "src/scripts/old-history-generator/output.json";

if(!await fileExists(floatplaneDataPath)) {
    console.log("Missing floatplane vod data! I'm going to fetch it from floatplane. This can take a bit");
    await fetchFloatplaneShows()
} else {
    console.log("Floatplane data already exists. Skipping download");
}

if(!await fileExists(youtubeDataPath) || process.argv.includes("--download-yt-vods")) {
    console.log("Missing youtube vod data! I'm going to fetch it from youtube's api. This can take a bit");
    await fetchYoutubeShows();

    await wait(500); // because the old file keeps getting read for some reason
} else {
    console.log("Youtube data already exists. Skipping download (use --download-yt-vods to override)");
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const floatplaneData = (await import("./floatplane-wan-vods.json", {assert: {type: 'json'}})).default as unknown as {[key: string]: FloatplanePost};
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const youtubeData = (await import("./youtube-wan-vods.json", {assert: {type: 'json'}})).default as unknown as {[key: string]: SpecificData};

const youtubeNumber = Object.keys(youtubeData).length;

console.log(Object.keys(floatplaneData).length + " floatplane videos");
console.log(youtubeNumber + " youtube videos");

let previousOldShows: HistoricalEntry[] = [];
if(await fileExists(outputDataPath)) {
    previousOldShows = (await import("./output.json", {assert: {type: 'json'}})).default as unknown as HistoricalEntry[]
}

const oldShows: HistoricalEntry[] = [];

let i = 0;
for (const date in youtubeData) {
    const floatplaneVod = floatplaneData[date];
    const youtubeVod = youtubeData[date];

    if(!youtubeVod.liveStreamingDetails) {
        // console.warn(date + " is missing liveStreamingDetails!");
    }

    if(!floatplaneVod) {
        // console.warn(date + " is missing floatplane entry!")
    }

    const mainShowStart = youtubeVod.liveStreamingDetails?.actualStartTime;
    const showEnd = youtubeVod.liveStreamingDetails?.actualEndTime;
    let preShowStart;

    if(floatplaneVod && mainShowStart && showEnd) {
        const floatplaneLength = floatplaneVod.metadata.videoDuration * 1000;
        const youtubeLength = new Date(showEnd).getTime() - new Date(mainShowStart).getTime();

        const preShowLength = floatplaneLength - youtubeLength;

        preShowStart = new Date(mainShowStart);
        preShowStart.setMilliseconds(preShowStart.getMilliseconds() - preShowLength);
    }

    const mainShowLength = youtubeVod?.contentDetails?.duration ? Duration.fromISO(youtubeVod.contentDetails.duration).as("milliseconds") : undefined;

    const rawTitle = youtubeVod.snippet?.title;
    let title;
    if(rawTitle) {
        if(rawTitle.toLowerCase().startsWith("the wan show")) {
            const extraDebug = date === "2013/10/25";
            if(extraDebug) console.log("Extra debug on", date)
            // old shows started with "The WAN Show"
            title = rawTitle.substring(14);
            if(extraDebug) console.log({before: rawTitle, afterSnip: title})
            if(title.includes(" - ")) {
                const parts = title.split(" - ");
                let endingDate = parts.pop(); // do a pop to only remove the stuff after the *last* dash
                if(endingDate) endingDate = endingDate // filter out "st" from "1st" and other similar suffixes, since it messes up below check
                  .replaceAll("st", "")
                  .replaceAll("nd", "")
                  .replaceAll("rd", "")
                if(extraDebug) console.log({endingDate})
                if(!isNaN(new Date(endingDate ?? "October 24, 2014").getDate())) { // only remove content after - if it is a date
                    title = parts.join(" - ");
                }
                if(extraDebug) console.log({afterDateTrim: title})
            }
        } else {
            const parts = rawTitle.split(" - ");
            parts.pop(); // do a pop to only remove the stuff after the *last* dash
            title = parts.join(" - ");
        }
    }

    const oldThumbnails: {[key: string]: YoutubeThumbnail} | undefined
      = previousOldShows.find(value => value.name == date)
      ?.metadata.snippet?.thumbnails

    if(youtubeVod.snippet?.thumbnails) {
        const promises = [];
        let i = 0;
        const thumbnailCount = Object.keys(youtubeVod.snippet?.thumbnails).length;
        for (const thumbnailKey in youtubeVod.snippet?.thumbnails) {
            i++;
            const fi = i;
            promises.push((async () => {
                const start = Date.now();
                const thumbnail = (youtubeVod.snippet?.thumbnails as {[key: string]: YoutubeThumbnail})[thumbnailKey];
                const oldThumbnail = oldThumbnails?.[thumbnailKey];

                // Only run OCR on highest quality image
                if(fi === thumbnailCount /*&& (!oldThumbnail?.text || oldThumbnail?.url !== thumbnail.url)*/) {
                    console.log("Running OCR on " + thumbnail.url);

                    // const imageBase64 = await imageUrlToBase64(thumbnail.url);

                    const image = await fetch(thumbnail.url)
                      .then(r => r.arrayBuffer());
                    const buffer = await sharp(image)
                      .flatten()
                      .modulate({
                          // remove some of the brightness to crush some non-white thumbnail text
                          lightness: -70
                      })
                      .toBuffer();

                    const text = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + process.env.YOUTUBE_KEY, {
                        method: "POST",
                        body: JSON.stringify(
                          {
                              requests: [
                                  {
                                      image: {
                                          content: buffer.toString('base64')
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
                      // .then(r => {console.log(r); return r;})
                      .then(r => {
                          if(r.responses.length < 1 || !r.responses[0].textAnnotations || r.responses[0].textAnnotations.length < 1) {
                              console.log("No text from google ocr for " + thumbnail.url + ".")
                              return null;
                          }
                          return r.responses[0].textAnnotations[0].description;
                      });
                    (youtubeVod.snippet?.thumbnails as {[key: string]: YoutubeThumbnail})[thumbnailKey].text = text;
                }

                if(oldThumbnail?.url === thumbnail.url && oldThumbnail?.blurhash) {
                    (youtubeVod.snippet?.thumbnails as {[key: string]: YoutubeThumbnail})[thumbnailKey].blurhash = oldThumbnail.blurhash;
                    return;
                }

                const image = await fetch(thumbnail.url)
                  .then(r => r.arrayBuffer());
                const {data, info} = await sharp(image)
                  .raw()
                  .ensureAlpha(0)
                  .toBuffer({resolveWithObject: true})

                const { width, height } = info;

                if(typeof width == "undefined" || typeof height == "undefined") {
                    console.warn("Thumbnail " + thumbnailKey + " for show " + date + " is missing width/height!");
                    return;
                }


                const clamped = Uint8ClampedArray.from(data);

                // console.log({url: thumbnail.url, length: clamped.length, width, height, area: width * height, properLength: width * height * 4})

                const hash = encode(clamped, width, height, 5, 4);
                (youtubeVod.snippet?.thumbnails as {[key: string]: YoutubeThumbnail})[thumbnailKey].blurhash = {
                    hash,
                    w: width,
                    h: height,
                    cX: 5,
                    cY: 4
                }
                console.log(date+" " + thumbnailKey + " took " + (Date.now() - start) + "ms (blurhash calculated)");
            })())
        }
        await Promise.all(promises);
    }

    oldShows.push({
        name: date,
        metadata: {
            preShowStart: preShowStart ? preShowStart.toISOString() : undefined,
            mainShowStart,
            showEnd,
            title,
            mainShowLength,
            vods: {
                floatplane: floatplaneVod ? floatplaneVod.id : undefined,
                youtube: youtubeVod.id
            },
            snippet: youtubeVod.snippet
        }
    });


    i++;
    if(i % 50 == 0) {
        console.log("Status: " + i + "/" + youtubeNumber + " shows processed (" + (Math.floor((i/youtubeNumber) * 1000) / 10) + "%)")
    }
}

await fs.writeFile(outputDataPath, JSON.stringify(oldShows, undefined, '\t'))
console.log("Done!")






