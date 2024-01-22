import { error, } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load = (() => {
  throw error(500, "here you go")
}) satisfies PageLoad