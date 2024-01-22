import { error, } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { dev } from "$app/environment";

export const load = (() => {
  if(dev) throw error(500, "here you go");
  return {};
}) satisfies PageLoad