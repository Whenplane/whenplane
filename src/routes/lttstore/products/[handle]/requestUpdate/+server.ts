import { error, type RequestHandler } from "@sveltejs/kit";

export const POST = (async ({platform, params}) => {

  const object = platform?.env?.LTTSTORE_UPD_REQ_OBJ;
  if(!object) throw error(503, "Missing object!");

  if(!params.handle) throw error(400, "Missing handle!");

  const id = object.idFromName("69");
  const stub = await object.get(id);

  const searchParams = new URLSearchParams();
  searchParams.set("handle", params.handle);

  return await stub.fetch("https://UPD_REQ_DO/?" + searchParams)

}) satisfies RequestHandler;