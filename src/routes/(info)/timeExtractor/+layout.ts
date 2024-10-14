import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import type { LayoutLoad } from "../../../../.svelte-kit/types/src/routes";

export const load = (async () => {
  if(!dev) throw error(503, "Not available in prod");
  return {};
}) satisfies LayoutLoad;