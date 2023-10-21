export function wait(ms: number) {
    return new Promise((res) => {
        setTimeout(res, Math.floor(ms));
    });
}

export function random(min: number, max: number) {
    return (Math.random() * (max - min)) + min;
}



export type HistoricalEntry = {
    name: string,
    metadata: OldShowMeta,
    value?: OldShowMeta
}

export type OldShowMeta = {
    preShowStart?: string,
    mainShowStart?: string,
    showEnd?: string,
    title?: string,
    mainShowLength?: number
    vods?: {
        floatplane?: string,
        youtube: string,
        youtubeParts?: string[]
    },
    snippet?: {
        publishedAt: string,
        channelId: string,
        title: string,
        description?: string,
        thumbnails: {
            default?: YoutubeThumbnail,
            medium?: YoutubeThumbnail,
            high?: YoutubeThumbnail,
            standard?: YoutubeThumbnail,
            maxres?: YoutubeThumbnail
        },
        channelTitle: string,
        tags?: string[],
        categoryId?: string,
        localized?: {
            title: string,
            description: string
        }
    }
}

export type YoutubeThumbnail = {
    url: string,
    width: number,
    height: number,
    blurhash?: BlurHash
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

export type WanDb_FloatplaneData = {
    live?: boolean,
    isWAN?: boolean,
    title?: string,
    description?: string,
    thumbnail?: string
    error?: any
};

export type WanDb_SocketState = {
    lastReceive: number
}

export type MainLate = {
    isMainLate: boolean,
    string?: string,
    late?: boolean,
    distance?: number
}