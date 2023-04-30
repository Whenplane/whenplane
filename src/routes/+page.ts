import type {Load} from "@sveltejs/kit";

export const load = (async ({fetch}) => {
    return {
        liveStatus: await fetch("/api/aggregate").then(r => r.json())
    }
}) satisfies Load;