import { serviceWorker } from "$lib/stores";

export async function getPushSubscription() {
  if(!serviceWorker) return null;
  return await serviceWorker?.pushManager?.getSubscription();
}

export const lang: {[key: string]: {name: string, description: string}} = {
  imminent: {
    name: "Imminent Show Notifications",
    description: "Get a notification when the show is imminent (a thumbnail is uploaded)"
  },
  preshow_live: {
    name: "Pre-Show Live Notification",
    description: "Get a notification when the pre-show starts (everywhere other than youtube)"
  },
  mainshow_live: {
    name: "Main Show Live Notification",
    description: "Get a notification when the main show starts (on youtube). Due to youtube api restrictions, this will probably be delayed by a few minutes at least."
  },

  other_streams_imminent: {
    name: "Imminent Other Stream Notifications",
    description: "Get a notification when a non-wan stream is close to starting on the LinusTechTips channel(s)"
  },
  other_streams: {
    name: "Other Stream Live Notifications",
    description: "Get a notification when a non-wan stream starts on the LinusTechTips channel(s)"
  },

  elijah_stream: {
    name: "Elijah Stream Notifications",
    description: "Get a notification when Elijah (BocaBola) starts streaming on twitch"
  },
  dan_stream: {
    name: "Dan Stream Notifications",
    description: "Get a notification when Dan (BuhDan) starts streaming on twitch"
  },
  // luke_stream: {
  //   name: "Luke Stream Notifications",
  //   description: "Get a notification when Luke (luke_lafr) starts streaming on twitch"
  // },
}

export function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/")

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}


