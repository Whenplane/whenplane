import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";

export const GET = (async () => {
  if(!dev) throw error(503, "Not available in prod!");
  const image = await fetch("https://i.ytimg.com/vi/TXsw_92Y2e0/maxresdefault.jpg")
    .then(r => r.arrayBuffer());
  const buffer = await ((await import("sharp")).default)(image)
    .flatten()
    .modulate({
      lightness: -70
    })
    .toBuffer()

  return new Response(new Blob([buffer]))
})