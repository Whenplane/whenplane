import { redirect } from "@sveltejs/kit";


export const load = (() => {
  throw redirect(301, "https://discord.gg/PmN9AJh6KR")
})