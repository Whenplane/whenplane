import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";

export const GET = (async () => {
  if(!dev) throw error(503, "Not available in prod!");
  const image = await fetch("https://i.ytimg.com/vi/4QUzf-J0w_o/maxresdefault_live.jpg")
    .then(r => r.arrayBuffer());
  const buffer = await ((await import("sharp")).default)(image)
    .flatten()
    .modulate({
      lightness: -70
    })
    .toBuffer()

  return new Response(new Blob([buffer]))
})