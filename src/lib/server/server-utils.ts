
export function log(platform: App.Platform, message: string) {
  if(!platform.env?.LOG_MESSAGES) {
    console.warn("Log messages missing! Here is the message:", message);
    return;
  }
  if(!platform.context?.waitUntil) {
    console.warn("waitUntil is missing! Here is the message:", message);
    return;
  }
  platform.context.waitUntil((async () => {
    await platform.env?.LOG_MESSAGES.writeDataPoint({
      blobs: [message],
      doubles: [],
      indexes: []
    })
  }));
}