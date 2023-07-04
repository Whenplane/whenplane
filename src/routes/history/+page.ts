import type {PageLoad} from "./$types";

export const load = (async ({fetch}) => {
    const records = fetch("/api/history/records").then(r => r.json());
    return {
        history: {
            currentYear: await fetch("/api/history/year/" + new Date().getFullYear()).then(r => r.json()),
            records
        }
    }
}) satisfies PageLoad;