import type {ServerLoad} from "@sveltejs/kit";
import {error} from "@sveltejs/kit";

export const load = (async ({params, fetch}) => {
    const response = await fetch(
        "/api/history/show/" + params.showDate,
        {
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const data = await response.json();

    if(response.status != 200) {
        throw error(response.status, data.message || response.statusText);
    }

    return data;
}) satisfies ServerLoad