import type {PageLoad} from "./$types";
import {wait} from "$lib/utils";

export const load = (async ({fetch}) => {
    const records = fetch("/api/history/records").then(r => r.json());
    const currentYear = await fetch("/api/history/year/" + new Date().getFullYear()).then(r => r.json());

    // only wait 50ms extra for records. If they aren't done fetching by then,
    //  just return the promise so sveltekit can stream it when it does finish
    const returned = await Promise.any([records, wait(50)]);

    const recordsDone = !!returned;
    return {
        history: {
            currentYear,
            records: recordsDone ? await records : records
        }
    }
}) satisfies PageLoad;