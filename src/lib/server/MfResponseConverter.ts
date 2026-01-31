import { dev } from "$app/environment";

export async function createMFResponse(response: Response) {
  if (dev) {
    const { realCreateMFResponse } = await import("./clients/miniflare");
    return await realCreateMFResponse(response) as Response
  }
  return response;
}