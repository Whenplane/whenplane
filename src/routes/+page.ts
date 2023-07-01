import type {PageLoad} from "./$types";
import {browser} from "$app/environment";


export const load = (async ({fetch, url}) => {
    const fast = (!browser || (location && location.pathname !== "/"));
    const cacheBuster = fast ? "" : "&r=" + Date.now();
    const liveStatus = await fetch("/api/aggregate?fast=" + fast + cacheBuster)
        .then(r => r.json());

    const isPreShow = !liveStatus.youtube.isWAN && liveStatus.twitch.isWAN;
    const isMainShow = liveStatus.youtube.isWAN;

    const preShowStarted = isPreShow ? liveStatus.twitch.started : undefined;
    const mainShowStarted = isMainShow ? liveStatus.youtube.started : undefined;

    return {
        isPreShow,
        isMainShow,
        liveStatus,
        preShowStarted,
        mainShowStarted,
        fast
    }
}) satisfies PageLoad;