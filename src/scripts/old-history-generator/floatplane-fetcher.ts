// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {random, wait} from "../../lib/utils.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {getClosestWan, getPreviousWAN, getUTCDate} from "../../lib/timeUtils.ts";
import fs from 'node:fs/promises';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {floatplaneDataPath} from "./index.ts";


export async function fetchFloatplaneShows() {

    const showVods: {[key: string]: FloatplanePost} = {};

    let after = 0;
    let lastDate = "2023/05/12";
    while(after < 10000 && new Date(lastDate).getTime() > 1559346000000) {
        try {
            const response = await fetch("https://www.floatplane.com/api/v3/content/creator?id=59f94c0bdd241b70349eb72b&hasVideo=false&hasAudio=false&hasPicture=false&hasText=false&sort=DESC&search=WAN%20show&fetchAfter=" + after)
            const contentType = response.headers.get("content-type");
            if(response.status != 200 || !contentType?.includes("application/json")) {
                console.error("Response error! Retrying in 30 seconds..")
                console.debug({status: response.status, contentType, after})
                await wait(30e3);
                continue;
            }

            const data = await response.json() as FloatplanePost[];

            if(data.length == 0) {
                console.log("Processed all floatplane videos! (containing 'WAN show')");
                break;
            }
            for (const video of data) {
                let wanSplitter = "-";
                if(!video.title.includes(wanSplitter + " WAN Show")) {
                    wanSplitter = "–";
                    if(!video.title.includes(wanSplitter + " WAN Show")) {
                        console.log("'" + video.title + "' is not wan!")
                        continue;
                    }
                }

                let extractedDate = video.title.split(wanSplitter + " WAN Show ")[1];

                // Some vods have stuff after the date we don't want, so we need to filter
                const lastNumbers = last(extractedDate.match(/(20[1-9][0-9])/g) || []);
                if(!lastNumbers) continue;
                extractedDate = extractedDate.substring(0, extractedDate.lastIndexOf(lastNumbers) + 4);

                const date = getClosestWan(new Date(extractedDate)) as Date;

                // Only record videos that were posted before auto-recording started
                if(date.getTime() > 1683934200000) continue;

                const dateName = getUTCDate(date);

                showVods[dateName] = video;
                lastDate = dateName;
            }

            after += 20;
            console.log("Got first " + after);
            await wait(random(1e3, 5e3));
        } catch(e) {
            console.error("Caught error at ", {after, lastDate});
            console.error(e);
            break;
        }
    }

    console.log("Done fetching from floatplane api. Writing file");

    await fs.writeFile(floatplaneDataPath, JSON.stringify(showVods, undefined, '\t'))

    console.log("Done fetching floatplane vods!");
}

function last<Type>(array: Type[]) {
    if(array.length == 0) return undefined;
    return array[array.length - 1];
}

export type FloatplanePost = {
    id: string,
    guid: string,
    title: string,

    /** acts as the description on videos **/
    text: string,

    type: string,
    channel: FloatplaneChannel,
    tags: string[],
    attachmentOrder: string[],
    releaseDate: string,
    likes: number,
    dislikes: number,
    score: number,
    comments: number,
    creator: FloatplaneCreator,
    wasReleasedSilently: boolean,
    metadata: {
        hasVideo: boolean,
        videoCount: number,
        videoDuration: number,
        hasAudio: boolean,
        audioCount: number,
        audioDuration: number,
        hasPicture: boolean
        pictureCount: number,
        isFeatured: boolean,
        hasGallery: boolean,
        galleryCount: number
    },
    thumbnail: FloatplaneImage,
    isAccessible: boolean,
    galleryAttachments: string[]
    videoAttachments: string[]
    audioAttachments: string[]
    pictureAttachments: string[]
}

type FloatplaneChannel = {
    id: string,
    creator: string,
    title: string,
    urlname: string,
    about: string,
    order: number,
    icon: FloatplaneImage
}

type FloatplaneImage = {
    width: number,
    height: number,
    path: string,
    childImages?: FloatplaneImage[]
}

type FloatplaneCreator = {
    id: string,
    owner: {
        id: string,
        username: string
    },
    title: string,
    urlname: string,
    description: string,
    about: string,
    category: {
        id: string,
        title: string
    },
    cover: FloatplaneImage,
    icon: FloatplaneImage,
    subscriptionPlans: FloatplaneSubscription[],
    discoverable: boolean,
    subscriberCountDisplay: string,
    incomeDisplay: false,
    defaultChannel: string,
    channels: string[],
    card: FloatplaneImage
}

type FloatplaneSubscription = {
    id: string,
    title: string,
    description: string,
    price: string,
    priceYearly: string,
    currency: string,
    logo?: FloatplaneImage,
    interval: string,
    featured: boolean,
    allowGrandfatheredAccess: boolean,
}