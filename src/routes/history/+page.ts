import type {PageLoad} from "./$types";
import {wait} from "$lib/utils";
import { browser } from "$app/environment";
import { getCookie } from "$lib/cookieUtils";

export const load = (async ({fetch, params, url}) => {
    const oldHistory = url.searchParams.has("old") ? import("$lib/oldHistory") : undefined;
    const records = fetch("/api/history/records").then(r => r.json());
    const currentYear = await fetch("/api/history/year/" + new Date().getFullYear()).then(r => r.json());

    // only wait 50ms extra for records. If they aren't done fetching by then,
    //  just return the promise so sveltekit can stream it when it does finish
    const returned = await Promise.any([records, wait(50)]);


    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let viewType: number | null = Number(params.__c__viewType);
    if(isNaN(viewType) && browser) viewType = Number(getCookie("historyViewType"))
    if(isNaN(viewType)) viewType = null;

    const recordsDone = !!returned;
    return {
        history: {
            currentYear,
            records: recordsDone ? await records : records,
            viewType,
            oldHistory: oldHistory ? await oldHistory : undefined
        }
    }
}) satisfies PageLoad;