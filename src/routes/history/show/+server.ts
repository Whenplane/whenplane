import { redirect } from "@sveltejs/kit";

export const GET = (() => {
  throw redirect(301, "/history");
})