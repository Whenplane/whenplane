// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type {OldShowMeta} from "../../lib/utils.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {getClosestWan, getPreviousWAN, getUTCDate} from "../../lib/timeUtils.ts";
import fs from "node:fs/promises";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {youtubeDataPath} from "./index.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fileExists} from "./utils.ts";


export async function fetchYoutubeShows() {

    if(!process.env.YOUTUBE_KEY) {
        throw new Error("Missing youtube key!");
    }

    let oldData = {};
    if(await fileExists(youtubeDataPath)) {
        oldData = (await import("./youtube-wan-vods.json", {assert: {type: 'json'}})).default as unknown as {[key: string]: SpecificData};
    }

    let nextPage = undefined;
    const showVods: {[key: string]: SpecificData} = {}

    let first = true

    while(first || nextPage) {
        first = false;
        const response = await fetch(
            "https://youtube.googleapis.com/youtube/v3/search" +
            "?part=snippet" +
            "&channelId=UCXuqSBlHAE6Xw-yeJA0Tunw" +
            "&maxResults=50" +
            "&order=date" +
            (nextPage ? "&pageToken=" + nextPage : "") +
            "&publishedBefore=2023-05-12T23%3A30%3A00.000Z" +
            "&q=%22WAN%20Show%22" +
            "&type=video" +
            "&videoDuration=long" +
            "&key=" + process.env.YOUTUBE_KEY
        );

        const contentType = response.headers.get("content-type");
        if(response.status != 200 || !contentType?.includes("application/json")) {
            console.error("Invalid youtube response!");
            console.debug({status: response.status, contentType, nextPage})
            break;
        }

        const data = await response.json() as YoutubeListResponse;

        let lastDate = "none";

        for (const video of data.items) {
            if(!video.snippet?.title) {
                console.warn("Skipping " + video.id.videoId + " due to missing snippet/title!")
                continue;
            }
            const lowerTitle = video.snippet.title.toLowerCase()
            if(!lowerTitle.includes("wan show") && !lowerTitle.includes("linus tech tips live show") && !lowerTitle.includes("live stream archive")) {
                console.log("Skipping ", video.snippet.title, video.id.videoId);
                continue;
            }

            const specificResponse = await fetch(
                "https://youtube.googleapis.com/youtube/v3/videos" +
                "?part=snippet%2CliveStreamingDetails%2CcontentDetails" +
                "&id=" + encodeURIComponent(video.id.videoId) +
                "&locale=en" +
                "&key=" + process.env.YOUTUBE_KEY
            )
            const specificContentType = response.headers.get("content-type");

            if(specificResponse.status != 200 || !specificContentType?.includes("application/json")) {
                console.error("Invalid youtube response (specific)!");
                console.debug({status: specificResponse.status, specificContentType, nextPage})
                continue;
            }

            const specificData = await specificResponse.json() as YoutubeSpecificResponse;

            for (const video of specificData.items) {
                const publishedAt = video.snippet?.publishedAt;
                if(!publishedAt) {
                    console.warn(video.id + " is missing a publishedAt date!")
                    continue;
                }

                const publishDate = new Date(publishedAt);
                if(publishDate.getUTCDay() === 5) {
                    if(video.snippet?.title.includes(publishDate.getDate()+"")) {
                        publishDate.setDate(publishDate.getDate() + 1);
                    } else {
                        publishDate.setDate(publishDate.getDate() - 2);
                    }
                }
                const date = getPreviousWAN(publishDate) as Date;

                const dateName = getUTCDate(date);

                // Only record videos that were posted before auto-recording started
                if(date.getTime() > 1683934200000) {
                    console.warn("Skipping " + dateName + " due to being after automatic recording cutoff")
                    continue;
                }

                lastDate = publishedAt;

                if(showVods[dateName]) {
                    // handle multiple parts

                    const thisStart = video.liveStreamingDetails?.actualStartTime;
                    const thisEnd = video.liveStreamingDetails?.actualEndTime;
                    const existingStart = showVods[dateName].liveStreamingDetails?.actualStartTime;
                    const existingEnd = showVods[dateName].liveStreamingDetails?.actualEndTime;

                    if(thisStart && existingStart) {
                        const oldStart = new Date(existingStart);
                        const newStart = new Date(thisStart);
                        if(newStart.getTime() < oldStart.getTime()) {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            showVods[dateName].liveStreamingDetails
                              .actualStartTime = thisStart;
                        }
                    }

                    if(thisEnd && existingEnd) {
                        const oldEnd = new Date(existingEnd);
                        const newEnd = new Date(thisEnd);
                        if(newEnd.getTime() > oldEnd.getTime()) {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            showVods[dateName].liveStreamingDetails
                              .actualEndTime = thisEnd;
                        }
                    }

                    if(showVods[dateName].snippet?.title) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        showVods[dateName].snippet.title = showVods[dateName].snippet.title.replaceAll(/\(PT [0-9]\)/g, "")
                    }

                } else {
                    showVods[dateName] = video;
                }
            }
        }

        console.log("Status update: got to " + lastDate);

        nextPage = data.nextPageToken;
    }

    const combinedData = {
        ...oldData,
        ...showVods
    }

    const sortedData = Object.fromEntries(
      Object.entries(combinedData).sort(([a], [b]) => a > b ? 1 : a < b ? -1 : 0).reverse()
    )
    await fs.writeFile(youtubeDataPath, JSON.stringify(sortedData, undefined, '\t'))

}

type YoutubeListResponse = {
    nextPageToken: string,
    prevPageToken: string,
    regionCode: string,
    pageInfo: {
        totalResults: number,
        resultsPerPage: number
    },
    items: ListedYoutubeVideo[];
}

type ListedYoutubeVideo = {
    id: {
        kind: "youtube#video",
        videoId: string
    },
    snippet: OldShowMeta["snippet"],
    contentDetails: {
        "duration": string,
        "dimension": "2d" | "3d",
        "definition": "hd" | "sd",
        "caption": "true" | "false",
        "licensedContent": boolean,
        "projection": "rectangular" | "360"
    }
}

type YoutubeSpecificResponse = {
    nextPageToken: string,
    prevPageToken: string,
    regionCode: string,
    pageInfo: {
        totalResults: number,
        resultsPerPage: number
    },
    items: SpecificData[]
}

export type SpecificData = {
    kind: "youtube#video",
    id: string,
    snippet: OldShowMeta["snippet"],
    liveStreamingDetails?: {
        actualStartTime: string,
        actualEndTime: string
    },
    contentDetails: ListedYoutubeVideo["contentDetails"]
}