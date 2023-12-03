import {promises as fs} from "fs";
import { history as oldShows, type TimeOverrides } from "$lib/history/oldHistory.ts";
import type { HistoricalEntry } from "../../lib/utils.ts";
import { download } from "./time-extractor.ts";


const showsToDownload: HistoricalEntry[] = [];

let nextIndex = 0;

while(nextIndex < oldShows.length) {
  const currentShow = oldShows[nextIndex];
  const existingOverrides = JSON.parse(await fs.readFile("src/scripts/time-extractor/time-overrides.json", {encoding: "utf8"}) ?? "") as TimeOverrides;
  if(!currentShow?.metadata?.mainShowStart && currentShow?.metadata?.mainShowLength && !Object.keys(existingOverrides).includes(currentShow.name)) {
    showsToDownload.push(currentShow);
  }
  nextIndex++;
}

console.debug(showsToDownload.map(s => {
  return {name: s.name, mainShowStart: s.metadata?.mainShowStart};
}));
console.log("Found " + showsToDownload.length + " to download");

let currentI = "N/A";
let currentName = "N/A";

const reminderInterval = setInterval(() => {
  console.log("Currently working on " + currentName + " (" + (currentI) + "/" + showsToDownload.length + ")")
}, 30e3);

for (const i in showsToDownload) {
  const show = showsToDownload[i];

  currentI = (Number(i)+1)+"";
  currentName = show.name

  console.log("Starting download for " + show.name + " (" + (Number(i)+1) + "/" + showsToDownload.length + ")");

  const videoId = show.metadata.vods?.youtube;
  if(!videoId) {
    console.log(show.name + " is missing youtube vod! Skipping");
    continue;
  }


  try {
    await download(videoId);
  } catch(e) {
    console.error("Error while downloading", show.name, ":", e)
  }
  console.log("Finished " + show.name + " (" + (i+1) + "/" + showsToDownload.length + ")");
}
console.log("all done!");
clearInterval(reminderInterval);