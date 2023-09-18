// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fetchFloatplaneShows, FloatplanePost} from "./floatplane-fetcher.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fileExists} from "./utils.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fetchYoutubeShows, SpecificData} from "./youtube-fetcher.ts";

import 'dotenv/config'
import type {HistoricalEntry} from "$lib/utils";
import fs from "node:fs/promises";
import { Duration } from "luxon";

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
    await fetchYoutubeShows()
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

const oldShows: HistoricalEntry[] = [];

let i = 0;
for (const date in youtubeData) {
    const floatplaneVod = floatplaneData[date];
    const youtubeVod = youtubeData[date];

    if(!youtubeVod.liveStreamingDetails) {
        console.warn(date + " is missing liveStreamingDetails!");
    }

    if(!floatplaneVod) {
        console.warn(date + " is missing floatplane entry!")
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






