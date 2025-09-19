import { generateRandomBase32 } from "$lib/server/auth.ts";

export function log(platform: App.Platform | undefined, message: string, extra?: string) {
  if(!platform?.env?.LOG_MESSAGES) {
    console.warn("Log messages missing! Here is the message:", message);
    return;
  }
  if(!platform.context?.waitUntil) {
    console.warn("waitUntil is missing! Here is the message:", message);
    return;
  }
  platform.env?.LOG_MESSAGES.writeDataPoint({
    blobs: [message, extra],
    doubles: [],
    indexes: []
  })
}

export const INTERNAL_TOKEN = generateRandomBase32();