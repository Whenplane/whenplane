import type { RequestHandler } from "@sveltejs/kit";
import { getNextWAN } from "$lib/timeUtils";
import { text } from "@sveltejs/kit";

export const GET = (async ({fetch}) => {
  const hasDone = await fetch("/api/hasDone")
    .then(r => r.json())
    .then(r => r.hasDone)
  return text(getNextWAN(undefined, undefined, hasDone).toISOString());
}) satisfies RequestHandler;