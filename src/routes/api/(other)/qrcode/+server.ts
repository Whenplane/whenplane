import type {RequestHandler} from "@sveltejs/kit";
import QRCode from 'qrcode';
import {error} from "@sveltejs/kit";


export const GET = (async ({url, platform}) => {
  let tempText;
  const id = url.searchParams.get("id");
  if(id) {
    const cache = platform?.env?.CACHE;
    if(!cache) throw error(503, "Cache not available!");

    tempText = await cache.get("whenplane:temp_id:" + id);
    if(!tempText) throw error(404, "ID not found");
  }
  const text = url.searchParams.get("text") ?? tempText ?? "https://whenplane.com"
  const image = await QRCode.toString(text, {type: "svg"});

  return new Response(image, {
    headers: {
      "content-type": "image/svg+xml",
      "content-length": image.length+""
    }
  });
}) satisfies RequestHandler;