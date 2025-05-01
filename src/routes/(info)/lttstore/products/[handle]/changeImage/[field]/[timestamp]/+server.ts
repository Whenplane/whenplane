import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET = (async ({params, platform}) => {

  const productId = Number(params.handle ?? "NaN");
  const field = params.field;
  const timestamp = Number(params.timestamp ?? "NaN");

  if(isNaN(timestamp) || isNaN(productId)) throw error(400);

  const object = platform?.env?.LTTSTORE_CHANGE_SCREENSHOT;
  if(!object) throw error(503, "Screenshot object not available");

  const id = object.idFromName("yuh");
  const stub = object.get(id, {locationHint: "wnam"});

  const response = await stub.fetch(`http://screenshot/?productId=${productId}&timestamp=${timestamp}&field=${field}`);

  if(!response.ok) {
    return json(await response.json(), {
      status: response.status,
      statusText: response.statusText,
      headers: {...response.headers}
    });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-type": response.headers.get("content-type") ?? "image/png",
    }
  });


}) satisfies RequestHandler;