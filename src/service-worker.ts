/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, prerendered, version } from "$service-worker";

const CACHE_PREFIX = "cache-"
// Create a unique cache name for this deployment
const CACHE = CACHE_PREFIX + version;

const dontCache: string[] = [];

const ASSETS = [
  ...build, // the app itself
  ...files,  // everything in `static`
  ...prerendered
].filter((a) => !dontCache.includes(a));

const cacheablePages = [
  "/",
]


sw.addEventListener('install', (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {

    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await cache.addAll(cacheablePages);

    const others = await caches.keys()
      .then(keys => keys.filter(k => k !== CACHE))
      .then(keys => keys.filter(k => k.startsWith(CACHE_PREFIX)));

    for (const other of others) {
      await caches.delete(other);
    }

  }

  event.waitUntil(addFilesToCache());
});

sw.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  async function respond() {
    const cache = await caches.open(CACHE);

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname);

      if (response) {
        return response;
      }
    }

    try {
      const response = await fetch(event.request);

      // if we're offline, fetch can return a value that is not a Response
      // instead of throwing - and we can't pass this non-Response to respondWith
      if (!(response instanceof Response)) {
        throw new Error('invalid response from fetch');
      }

      // Assets should already be cached so this *shouldn't* happen, but we're here so why not
      if (response.status === 200) {
        event.waitUntil(cache.put(event.request, response.clone()));
      }

      return response;
    } catch(e) {
      const response = await cache.match(event.request);

      if (response) {
        return response;
      }

      // if there's no cache, then just error out
      // as there is nothing we can do to respond to this request
      throw e;
    }
  }

  if(ASSETS.includes(url.pathname) || cacheablePages.includes(url.pathname)) event.respondWith(respond());
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

  sw.registration.showNotification(title, {
    icon,
    ...data
  });
});