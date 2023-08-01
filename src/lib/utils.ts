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
    mainShowStart: string,
    showEnd: string,
    title?: string,
    vods?: {
        floatplane?: string,
        youtube: string
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
        categoryId?: string
    }
}

type YoutubeThumbnail = {
    url: string,
    width: number,
    height: number
}