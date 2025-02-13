import { type RequestHandler, text } from "@sveltejs/kit";
import { log } from "$lib/server/server-utils.ts";


export const GET = (async ({platform, url}) => {

  const message = url.searchParams.get("message") || "Hello World!";
  log(platform, "[/api/testLog] " + message)

  return text("done")
}) satisfies RequestHandler