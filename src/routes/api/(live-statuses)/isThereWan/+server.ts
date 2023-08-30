import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import type { KVNamespace } from "@cloudflare/workers-types";

export const GET = (async ({platform}) => {
  const meta: KVNamespace = platform?.env?.META;
  if(!meta) throw error(503, "meta not available");


  const promises = await Promise.all([
    meta.get("is-there-wan"),
    meta.get("is-there-wan:image-url")
  ]);

  const response: IsThereWanResponse = {
    text: promises[0],
    image: promises[1]
  }

  return json(response);
}) satisfies RequestHandler

export type IsThereWanResponse = {
  text: string | null
  image: string | null
}