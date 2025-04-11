import { wait } from "$lib/utils.ts";
import type { Timestamp } from "$lib/timestamps/types.ts";
import type {PageServerLoad} from "./$types"

export const load = (async ({fetch, parent}) => {

    const data = await parent();

    const youtubeId = data.value?.vods?.youtube;

    const mm = youtubeId ? fetch("/api/merch-messages/info/" + youtubeId)
      .then(r => r.json())
      .then(j => j.video as {videoId: string, status: string, title: string, messageCount?: number | null} | null)
      : undefined;

    const timestamps = youtubeId ? fetch("/api/timestamps/" + youtubeId).then(r => r.json() as Promise<Timestamp[]>) : undefined;

    // wait 25ms for above two promises to have a small chance of finishing
    if(youtubeId) await Promise.any([wait(25), mm, timestamps]);

    return {
        mm,
        timestamps
    };
}) satisfies PageServerLoad