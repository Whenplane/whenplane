import { error } from "@sveltejs/kit";
import type {RequestHandler} from "./$types";

export const POST = (async ({platform, params, cookies}) => {

  const object = platform?.env?.LTTSTORE_UPD_REQ_OBJ;
  if(!object) throw error(503, "Missing object!");

  if(!params.handle) throw error(400, "Missing handle!");

  const id = object.idFromName("69");
  const stub = object.get(id);

  // Get the session, so I (aj) can bypass the ratelimits when I am logged in
  // The update request object will verify the session
  const session = cookies.get("session");

  const searchParams = new URLSearchParams();
  searchParams.set("handle", params.handle);
  if(session) searchParams.set("session", session);

  return await stub.fetch("https://UPD_REQ_DO/?" + searchParams)
    .then(r => r as unknown as Response)

}) satisfies RequestHandler;