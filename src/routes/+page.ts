import type {Load} from "@sveltejs/kit";
import {browser} from "$app/environment";

export const load = (async ({fetch}) => {
    const liveStatus = await fetch("/api/aggregate?fast=" + !browser)
        .then(r => r.json());

    const isPreShow = !liveStatus.youtube.isWAN && liveStatus.twitch.isWAN;
    const isMainShow = liveStatus.youtube.isWAN || liveStatus.twitch.isWAN;

    const preShowStarted = isPreShow ? liveStatus.twitch.started : undefined;
    const mainShowStarted = isMainShow ? liveStatus.youtube.started : undefined;

    return {
        isPreShow,
        isMainShow,
        liveStatus,
        preShowStarted,
        mainShowStarted
    }
}) satisfies Load;