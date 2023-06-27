import type {Load} from "@sveltejs/kit";

export const load = (async ({fetch}) => {
    return {
        history: {
            currentYear: await fetch("/api/history/year/" + new Date().getFullYear()).then(r => r.json()),
            records: await fetch("/api/history/records").then(r => r.json())
        }
    }
}) satisfies Load