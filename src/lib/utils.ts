
export function wait(ms: number) {
    return new Promise((res) => {
        setTimeout(res, Math.floor(ms));
    });
}

export function random(min: number, max: number, int = false) {
    const rand = (Math.random() * (max - min)) + min;
    return int ? Math.floor(rand) : rand;
}

export function countTo(a: number, b?: number) {
    const start = b == undefined ? 1 : a;
    const end = b == undefined ? a : b;

    const r = [];

    for (let i = start; i <= end; i++) {
        r.push(i);
    }

    return r;
}

export async function retryD1<T>(run: () => Promise<T>, shouldRetry = shouldRetryD1): Promise<T> {
    let err: unknown | undefined = undefined;
    let attempt = 1;
    do {
        try {
            return await run();
        } catch(e) {
            console.warn("Got error on attempt #" + attempt, e)
            err = e;
            if(attempt >= 2) {
                await wait(500 * (attempt-1));
            }
        }
    } while(shouldRetry(err, ++attempt));

    throw err;
}

export function shouldRetryD1(err: unknown, nextAttempt: number) {
    const errMsg = String(err);
    const isRetryableError =
      errMsg.includes("Network connection lost") ||
      errMsg.includes("storage caused object to be reset") ||
      errMsg.includes("reset because its code was updated") ||
      errMsg.includes("which caused object to be reset") ||
      (errMsg.includes("error code: 500") && errMsg.includes("is not valid JSON")) ||
      errMsg === "D1_ERROR: Failed to parse body as JSON, got: error code: 500" ||
      errMsg.includes("Requests queued for too long") ||
      errMsg.includes("D1_ERROR: internal error;");

    return nextAttempt <= 7 && isRetryableError;
}

export function capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function truncateText(text: string, maxLength: number, elipsis = true) {
    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength) + (elipsis ? '\u2026' : '');
}

export function removeAfterLastDash(rawTitle: string) {
    const parts = rawTitle.split(" - ");
    if(parts.length <= 1) return rawTitle; // Don't remove if there is no dash
    parts.pop(); // do a pop to only remove the stuff after the *last* dash
    return parts.join(" - ");
}

export function e(s: string) {
    return btoa(s);
}

export function commas(x: number | undefined | null, decimals?: undefined | number) {
    if(typeof x === "undefined" || x === null) return x;
    const parts = (typeof decimals === "undefined" ? x.toString() : x.toFixed(decimals ?? 100))
      .split(".")
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts.length > 1 ? "." : "") + parts.slice(1).join(".");
}

export function newResponse(res: Response, headerFn?: (existingHeaders: Headers) => Headers): Promise<Response> {

    function cloneHeaders() {
        const headers = new Headers();
        for (const kv of res.headers as unknown as Iterable<[string, string]>) {
            headers.append(kv[0], kv[1]);
        }
        return headers;
    }

    const headers = headerFn ? headerFn(cloneHeaders()) : cloneHeaders();

    return new Promise((resolve) => {
        return res.clone().blob().then((blob) => {
            resolve(new Response(blob, {
                status: res.status,
                statusText: res.statusText,
                headers: headers
            }));
        });
    });

}

export function getSupportedLocales() {
    const supportedLanguages = [];
    const letters = 'abcdefghijklmnopqrstuvwxyz';

    function isLanguageCodeSupported(code: string) {
        const locale = new Intl.Locale(code);
        return locale.maximize().region !== undefined;
    }

    // ISO 639-1 (2-letter)
    for (let i = 0; i < letters.length; i++) {
        for (let j = 0; j < letters.length; j++) {
            const code = letters[i] + letters[j];
            if (isLanguageCodeSupported(code)) {
                supportedLanguages.push(code);
            }
        }
    }

    // ISO 639-2 (3-letter)
    for (let i = 0; i < letters.length; i++) {
        for (let j = 0; j < letters.length; j++) {
            for (let k = 0; k < letters.length; k++) {
                const code = letters[i] + letters[j] + letters[k];
                if (isLanguageCodeSupported(code)) {
                    supportedLanguages.push(code);
                }
            }
        }
    }

    return supportedLanguages;
}

export function escapeHtml(unsafe: string)
{
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

export function isIterable(obj: never) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export async function sha1(str: string, radix = 16) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-1", buffer);
    return hex(hash, radix);
}

export async function sha256(str: string, radix = 16) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return hex(hash, radix);
}

export function hex(buffer: ArrayBuffer, radix = 16) {
    let digest = ''
    const view = new DataView(buffer)
    for(let i = 0; i < view.byteLength; i += 4) {
        // We use getUint32 to reduce the number of iterations (notice the `i += 4`)
        const value = view.getUint32(i)
        // toString(16) will transform the integer into the corresponding hex string
        // but will remove any initial "0"
        const stringValue = value.toString(radix)
        // One Uint32 element is 4 bytes or 8 hex chars (it would also work with 4
        // chars for Uint16 and 2 chars for Uint8)
        const padding = '00000000'
        const paddedValue = (padding + stringValue).slice(-padding.length)
        digest += paddedValue
    }

    return digest
}



export type HistoricalEntry = {
    name: string,
    metadata: OldShowMeta,
    value?: OldShowMeta
}

export type OldShowMeta = {
    preShowStart?: string | null,
    mainShowStart?: string | null,
    showEnd?: string | null,
    title?: string | null,
    mainShowLength?: number | null,
    thumbnails?: YoutubeThumbnails,
    vods?: {
        floatplane?: string,
        youtube: string,
        youtubeParts?: string[]
    },
    snippet?: YoutubeSnippet | null
}

export type YoutubeSnippet = {
    publishedAt: string,
    channelId: string,
    title: string,
    description?: string,
    thumbnails: YoutubeThumbnails,
    channelTitle: string,
    tags?: string[],
    categoryId?: string,
    localized?: {
        title: string,
        description: string
    }
}

export type YoutubeThumbnails = {
    default?: YoutubeThumbnail,
    medium?: YoutubeThumbnail,
    high?: YoutubeThumbnail,
    standard?: YoutubeThumbnail,
    maxres?: YoutubeThumbnail
}

export type YoutubeThumbnail = {
    url: string,
    width: number,
    height: number,
    blurhash?: BlurHash,
    text?: string
}

export type BlurHash = {
    hash: string,
    h: number,
    w: number,
    cX: number,
    cY: number
}

export type DataTransformFunction = (show: HistoricalEntry) => number

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

export type FloatplaneChannel = {
    id: string,
    creator: string,
    title: string,
    urlname: string,
    about: string,
    order: number,
    icon: FloatplaneImage
}

export type FloatplaneImage = {
    width: number,
    height: number,
    path: string,
    childImages?: FloatplaneImage[]
}

export type FloatplaneCreator = {
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

export type FloatplaneSubscription = {
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

export type MainLate = {
    isMainLate: boolean,
    string?: string,
    late?: boolean,
    distance?: number
}

export type SpecialStream = {
    title: string,
    thumbnail?: string,

    start?: string,
    end?: string,
    startIsEstimated?: boolean

    onFloatplane?: boolean,
    floatplaneNotes?: string

    onTwitch?: boolean,
    twitchNotes?: string,

    onYoutube?: boolean
    youtubeNotes?: string
} | false;

export type TwitchToken = {
    token: string,
    validUntil: number,
    dateGenerated: number
}

export type FpProxyResponse = {
    id: string,
    title: string,
    description: string,
    thumbnail: FloatplaneImage,
    owner: string,
    channel: string,
    offline: {
        title: string,
        description: string,
        thumbnail: FloatplaneImage
    },
    isLive: boolean,
    started?: number | "unknown"
    fetched: number
}

export type FpLiveStatusResponse = {
    isLive: boolean,
    started?: string,
    lastLive?: string,
    isThumbnailNew: boolean,
    title: string,
    titleFirstSeen: string,
    thumbnail: string,
    thumbnailAge: number,
    thumbnailFirstSeen: string,
    description?: string,
    descriptionFirstSeen?: string,
    fetched?: number
}


export type MMJobData = {
    videoId: string;
    status: "starting" | "running" | "cancelled" | "finished" | "errored",
    step: "starting" | "downloading" | "extracting" | "reading" | "finishing",
    progressAt?: number,
    progressTotal?: number,
    downloadPercent?: number,
    preProcessPercent?: number,
    frameExtractPercent?: number
}