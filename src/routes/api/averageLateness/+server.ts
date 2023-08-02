import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

export const GET = (async ({platform}) => {

  const meta = platform?.env?.META;
  if(!meta) throw error(503, "Missing meta KV!");

  return json(
    await meta.get("averageLateness", {type: 'json'})
  );

}) satisfies RequestHandler;