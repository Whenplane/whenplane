import { json, type RequestHandler } from "@sveltejs/kit";

const handle = (({request}) => {


  return json(Object.fromEntries(request.headers as unknown as Iterable<[string, string]>))

}) satisfies RequestHandler;

export const GET = handle;
export const POST = handle;