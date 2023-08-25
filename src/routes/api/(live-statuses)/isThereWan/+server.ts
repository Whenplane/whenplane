import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

export const GET = (async ({platform}) => {
  const meta = platform?.env?.META;
  if(!meta) throw error(503, "meta not available");


  const promises = await Promise.all([
    meta.get("is-there-wan"),
    meta.get("is-there-wan:image-url")
  ]);

  return json({
    text: promises[0],
    image: promises[1]
  })
}) satisfies RequestHandler