import { error, type RequestHandler, text } from "@sveltejs/kit";
import { generateRandomBase32 } from "$lib/server/auth.ts";
import { dev } from "$app/environment";

export const GET = (() => {

  if(!dev) throw error(503, "Not available in prod")

  return text(generateRandomBase32())

}) satisfies RequestHandler