<script lang="ts" context="module">
  import HistoricalShow from "$lib/history/HistoricalShow.svelte";

  let cache: {[show: string]: HistoricalShow} = {};
</script>
<script lang="ts">
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import { browser } from "$app/environment";

  export let showName: string;
  export let initiallyLoad = false;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let promise = new Promise<Response | {ok: boolean}>(() => {});
  let jsonPromise = new Promise<HistoricalShow>(() => {});

  function loadShow() {
    if(cache[showName]) {
      promise = Promise.resolve({ok: true})
      jsonPromise = Promise.resolve(cache[showName])
    } else {
      promise = fetch("/api/history/show/" + showName, {headers: {"Accept": "application/json"}});
      jsonPromise = (promise as Promise<Response>).then(r => r.json());
    }
  }

  if(initiallyLoad && browser) loadShow();
</script>
{#await promise}
  <div class="inline-block placeholder animate-pulse text-clear">{showName}</div>
{:then response}
  {#if response.ok}
    {#await jsonPromise}
      <div class="inline-block placeholder animate-pulse text-clear">{showName}</div>
    {:then showData}
      <img src="{showData.metadata?.thumbnails?.maxres.url ?? 'https://i.ytimg.com/vi/' + showData.metadata.vods?.youtube + '/maxresdefault.jpg'}" alt="" aria-hidden="true">
      <span class="text-[10px] leading-none">
        {showData.metadata.title}<br>
      </span>
      {new Date(showData.name).toLocaleDateString()}
    {/await}
  {:else}
    {showName} not ok!
  {/if}
{/await}
{#if browser}
  <div style="height: 0; display: inline-block;">
    <div class="relative pointer-events-none" style="bottom: 50em">
      <LazyLoad on:visible={loadShow} height="50em"/>
    </div>
  </div>
{/if}
<style>
    .text-clear {
        color: rgba(0, 0, 0, 0);
    }
    img {
        width: 10vw;
        aspect-ratio: 16 / 9;
    }
</style>