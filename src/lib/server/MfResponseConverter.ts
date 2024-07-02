import { dev } from "$app/environment";

export async function createMFResponse(response: Response) {
  if (dev) {
    const { realCreateMFResponse } = await import("./clients/miniflare");
    return realCreateMFResponse(response)
  }
  return response;
}