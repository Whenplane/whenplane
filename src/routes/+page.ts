import type {Load} from "@sveltejs/kit";

export const load = (async ({fetch}) => {
    const liveStatus = await fetch("/api/aggregate").then(r => r.json());

    const isPreShow = !liveStatus.youtube.isWAN && liveStatus.twitch.isWAN;
    const isMainShow = liveStatus.youtube.isWAN || liveStatus.twitch.isWAN
    return {
        isPreShow,
        isMainShow,
        liveStatus
    }
}) satisfies Load;