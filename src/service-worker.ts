/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, prerendered, version } from "$service-worker";

// const CACHE_PREFIX = "cache-"
const CACHE = "cache";

const dontCache: string[] = [
  "/_redirects"
];
const cacheablePages = [
  "/",
  "/about",
  "/support",
  "/extension"
]

const ASSETS = [
  ...build, // the app itself
  ...files,  // everything in `static`
  ...prerendered,
].filter((a) => !dontCache.includes(a));

const ALL_ASSETS = [
  ...ASSETS,
  ...cacheablePages
]


sw.addEventListener('install', (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {

    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);

    // remove old keys
    const oldKeys = await cache.keys()
      .then(ks => ks.filter(k => !ALL_ASSETS.includes(new URL(k.url).pathname)));


    for (const oldKey of oldKeys) {
      await caches.delete(oldKey.url);
    }

  }

  event.waitUntil(addFilesToCache());
});

sw.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  async function respond() {
    const cache = caches.open(CACHE);

    const cacheStart = Date.now();
    // `build`/`files` can always be served from the cache
    const browserCache: Promise<Response> = ASSETS.includes(url.pathname) ?
      cache.then(async c => {
        const match = await c.match(event.request);
        if(!match) throw new Error("No match");
        return match;
      }) :
      Promise.reject();

    browserCache.then(() => {
      console.debug("Fetching", url.pathname, "from cache took", (Date.now() - cacheStart) + "ms.")
    })

    const doFetch = (async () => {
      const response = await fetch(event.request, { signal: AbortSignal.timeout(3000) });

      // if we're offline, fetch can return a value that is not a Response
      // instead of throwing - and we can't pass this non-Response to respondWith
      if (!(response instanceof Response)) {
        throw new Error('invalid response from fetch');
      }

      // Assets should already be cached so this *shouldn't* happen, but we're here so why not
      if (response.status === 200) {
        event.waitUntil(cache.then(c => c.put(event.request, response.clone())));
      }

      console.debug("Not serving from cache", url.pathname);
      return response;
    })()

    return await Promise.any([browserCache, doFetch]) as Response;
  }

  if(ALL_ASSETS.includes(url.pathname)) event.respondWith(respond());
});

sw.addEventListener('activate', (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    const cacheNames = await caches.keys();
    if(!cacheNames.includes(CACHE)) {
      console.log("Current cache not in cache list! Skipping old cache deletion.");
      return;
    }
    for (const key of cacheNames) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});


sw.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  const data = event.data?.json() ?? {};
  const title = data.title || "Something Has Happened";
  const icon = "https://whenplane.com/wan.webp";

  console.debug("Got data to send notification", data);

  event.waitUntil(
    sw.registration.showNotification(title, {
      icon,
      ...data
    })
  )
});