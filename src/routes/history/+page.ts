import type {PageLoad} from "./$types";

export const load = (async ({fetch}) => {
    return {
        history: {
            currentYear: await fetch("/api/history/year/" + new Date().getFullYear()).then(r => r.json()),
            records: fetch("/api/history/records").then(r => r.json())
        }
    }
}) satisfies PageLoad;