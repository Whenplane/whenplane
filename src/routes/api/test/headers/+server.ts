import { json, type RequestHandler } from "@sveltejs/kit";

export const GET = (({request}) => {


  return json(Object.fromEntries(request.headers as unknown as Iterable<[string, string]>))

}) satisfies RequestHandler