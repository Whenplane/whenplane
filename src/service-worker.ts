/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, prerendered } from "$service-worker";

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

const ASSETS = [...new Set(
  [
    ...build, // /_app
    ...files,  // everything in `static`
    ...prerendered,
  ].filter((a) => !dontCache.includes(a))
)];

const ALL_ASSETS = [...
  new Set([
    ...ASSETS,
    ...cacheablePages
  ])
]

const cachePromise = caches.open(CACHE);

sw.addEventListener('install', (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {

    const cache = await cachePromise;
    await Promise.allSettled(ALL_ASSETS.map(a => cache.add(a)))

  }

  event.waitUntil(addFilesToCache());
});

sw.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  async function respond() {
    const is_cached = ASSETS.includes(url.pathname);

    const fromCache = () =>
      cachePromise.then(async c => {
        const match = await c.match(event.request);
        if(!match) throw new Error("No match");
        return match;
      });

    const cacheStart = Date.now();
    // `build`/`files` can always be served from the cache
    const browserCache: Promise<Response> = is_cached ?
      fromCache() :
      Promise.reject();

    browserCache.then(() => {
      console.debug("Fetching", url.pathname, "from cache took", (Date.now() - cacheStart) + "ms.")
    }).catch(() => {});

    const doFetch = (async () => {
      const response =
        (await event.preloadResponse) ??
        (await fetch(event.request, { signal: is_cached ? undefined : AbortSignal.timeout(3000) }));

      // if we're offline, fetch can return a value that is not a Response
      // instead of throwing - and we can't pass this non-Response to respondWith
      if (!(response instanceof Response)) {
        throw new Error('invalid response from fetch');
      }

      // Assets should already be cached so this *shouldn't* happen, but we're here so why not
      // Skips build files because those are immutable and will never change
      if (response.status === 200 && !build.includes(url.pathname)) {
        event.waitUntil(cachePromise.then(c => c.put(event.request, response.clone())));
      }

      console.debug("Not serving from cache", url.pathname);
      return response;
    })()

    // we race the fetch and the cache, because sometimes the cache can be much slower than fetching it fresh
    return await Promise.any([browserCache, doFetch])
      .catch(async e => { // fetching failed, try getting from cache if we haven't tried already
        // if is_cached is true, we already tried and errored with the local cache
        if (is_cached) throw e;
        console.warn("Fetch error, trying from cache", e);
        try {
          return await fromCache();
        } catch (_) {
          // throws the actual fetch error instead of the generic "no match" error
          throw e;
        }
      });
  }

  if(ALL_ASSETS.includes(url.pathname)) event.respondWith(respond());
});

// Wait for this sw to be active before we delete old cached files.
// Otherwise, when we were doing it in install before,
// a new version would delete files that were still being used by an old version!
sw.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (sw.registration.navigationPreload) await sw.registration.navigationPreload.enable();
    const cache = await cachePromise;

    // remove old keys
    const oldKeys = await cache.keys()
      .then(ks => ks.filter(k => !ALL_ASSETS.includes(new URL(k.url).pathname)));

    for (const oldKey of oldKeys) {
      await cache.delete(oldKey);
    }
  })())
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

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if(event.notification.tag.startsWith("elijah_stream")) {
    if (sw.clients.openWindow) event.waitUntil(sw.clients.openWindow("https://www.twitch.tv/bocabola"))
  }
})