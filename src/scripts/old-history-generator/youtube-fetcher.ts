// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type {OldShowMeta} from "../../lib/utils.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {getClosestWan, getUTCDate} from "../../lib/timeUtils.ts";
import fs from "node:fs/promises";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {youtubeDataPath} from "./index.ts";


export async function fetchYoutubeShows() {

    if(!process.env.YOUTUBE_KEY) {
        throw new Error("Missing youtube key!");
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
            if(!video.snippet?.title) continue;
            if(!video.snippet.title.includes("WAN Show") && !video.snippet.title.includes("Linus Tech Tips Live Show")) continue;

            const specificResponse = await fetch(
                "https://youtube.googleapis.com/youtube/v3/videos" +
                "?part=snippet%2CliveStreamingDetails" +
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
                if(!video.liveStreamingDetails) continue;
                const publishedAt = video.snippet?.publishedAt;
                if(!publishedAt) continue;
                const date = getClosestWan(new Date(publishedAt));

                // Only record videos that were posted before auto-recording started
                if(date.getTime() > 1683934200000) continue;

                lastDate = publishedAt;

                const dateName = getUTCDate(date);

                showVods[dateName] = video;
            }
        }

        console.log("Status update: got to " + lastDate);

        nextPage = data.nextPageToken;
    }

    await fs.writeFile(youtubeDataPath, JSON.stringify(showVods, undefined, '\t'))

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
    snippet: OldShowMeta["snippet"]
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
    }
}