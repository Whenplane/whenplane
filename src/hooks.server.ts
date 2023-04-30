import type {Handle} from "@sveltejs/kit";
import {dev} from "$app/environment";

export const handle: Handle = async ({ event, resolve }) => {
    // KV in dev
    if (dev) {
        const { fallBackPlatformToMiniFlareInDev } = await import('$lib/server/clients/miniflare');
        event.platform = await fallBackPlatformToMiniFlareInDev(event.platform);
    }

    const response = await resolve(event);

    return response;
}