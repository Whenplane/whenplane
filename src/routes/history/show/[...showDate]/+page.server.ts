import { wait } from "$lib/utils.ts";
import type { Timestamp } from "$lib/timestamps/types.ts";
import type {PageServerLoad} from "./$types"
import { INTERNAL_TOKEN } from "$lib/server/server-utils.ts";
import type { MMShow } from "$lib/merch-messages/mm-types.ts";

export const load = (async ({fetch, parent}) => {

    const data = await parent();

    const youtubeId = data.value?.vods?.youtube;

    const mm = fetch("/api/merch-messages-v2/info/" + data.name)
      .then(r => r.json())
      .then(j => j.show as MMShow | null);

    const timestamps = youtubeId ? fetch("/api/timestamps/" + youtubeId + "?token=" + INTERNAL_TOKEN)
      .then(r => r.json() as Promise<Timestamp[]>) : undefined;

    // wait 25ms for above two promises to have a small chance of finishing
    await Promise.any([wait(25), mm, timestamps ?? Promise.resolve()]);

    return {
        mm,
        timestamps
    };
}) satisfies PageServerLoad