import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";

const CACHE_TTL = 60 * 60e3;

const handleListCache = new Map<number, { handles: string[]; lastFetch: number }>();

export const load = (async ({ platform, params, url }) => {
    const db = platform?.env?.LTTSTORE_DB.withSession();
    if (!db) throw error(503, "DB unavailable!");

    const store = storeIdFromName(params.store);
    if (store === -1) {
        const newUrl = new URL(url);
        newUrl.pathname = newUrl.pathname.replace(/^\/lttstore/, "/lttstore/us");
        throw redirect(302, newUrl);
    }

    let entry = handleListCache.get(store);
    if (!entry || Date.now() - entry.lastFetch > CACHE_TTL) {
        entry = {
            handles: await retryD1(() =>
                db
                    .prepare("select handle from products where store = ?")
                    .bind(store)
                    .all<{ handle: string }>()
                    .then((r) => r.results.map((p) => p.handle))
            ),
            lastFetch: Date.now()
        };
        handleListCache.set(store, entry);
    }

    if (entry.handles.length === 0) throw error(404, "No products found for this store!");

    const handle = entry.handles[Math.floor(Math.random() * entry.handles.length)];
    throw redirect(302, `/lttstore/${params.store}/products/${handle}`);
}) satisfies PageServerLoad;
