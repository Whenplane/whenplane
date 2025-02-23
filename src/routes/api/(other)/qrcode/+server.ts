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

  const type = url.searchParams.has("png") ? "png" : "svg";

  if(type === "svg") {
    const image = await QRCode.toString(text, {type: "svg"});

    return new Response(image, {
      headers: {
        "content-type": "image/svg+xml",
        "content-length": image.length+""
      }
    });
  } else {
    const image = await QRCode.toDataURL(text, {type: "image/png", scale: 10, margin: 2});
    const response = base64ToArrayBuffer(image.split("base64,")[1]);

    return new Response(response, {
      headers: {
        "content-type": "image/png",
        "content-length": response.byteLength+""
      }
    });
  }
}) satisfies RequestHandler;

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}