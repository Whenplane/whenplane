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
    description: "Get a notification when the main show starts (on youtube)"
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
    description: "Get a notification when Elijah (BocaBola_) starts streaming on twitch"
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


export function sha256(str: string) {
  // Get the string as arraybuffer.
  const buffer = new TextEncoder().encode(str)
  return crypto.subtle.digest("SHA-256", buffer).then(function(hash) {
    return hex(hash)
  })
}

function hex(buffer: ArrayBuffer) {
  let digest = ''
  const view = new DataView(buffer)
  for(let i = 0; i < view.byteLength; i += 4) {
    // We use getUint32 to reduce the number of iterations (notice the `i += 4`)
    const value = view.getUint32(i)
    // toString(16) will transform the integer into the corresponding hex string
    // but will remove any initial "0"
    const stringValue = value.toString(16)
    // One Uint32 element is 4 bytes or 8 hex chars (it would also work with 4
    // chars for Uint16 and 2 chars for Uint8)
    const padding = '00000000'
    const paddedValue = (padding + stringValue).slice(-padding.length)
    digest += paddedValue
  }

  return digest
}