<script lang="ts">
  import { getClosestWan } from "$lib/timeUtils.ts";
  import { type MMJobData, truncateText } from "$lib/utils.ts";
  import { getDateFormatLocale } from "$lib/prefUtils.ts";
  import { page } from "$app/stores";
  import MerchMessage from "./components/MerchMessage.svelte";
  import Incomplete from "$lib/merch-messages/Incomplete.svelte";
  import { invalidateAll } from "$app/navigation";
  import Socket from "$lib/Socket.svelte";
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { slide } from "svelte/transition";

  export let data;

  let lastData: MMJobData;

  onMount(() => {
    if(dev && $page.params.videoId === "test") {
      setTimeout(() => {
        lastData = {
          videoId: "7LGuglDdliw",
          status: "running",
          step: "extracting",
          downloadPercent: 53/347,
          // preProcessPercent: 2837/23823,
          // frameExtractPercent: 3483/23823
        }
      }, Math.random() * 4e3);
    }
  })

  const thumbnail = data.value?.snippet?.thumbnails?.maxres ??
    data.value?.snippet?.thumbnails?.standard ??
    data.value?.snippet?.thumbnails?.high ??
    data.value?.snippet?.thumbnails?.medium ??
    data.value?.snippet?.thumbnails?.default

  const snippet = data.value?.snippet ?? data.metadata?.snippet;

  const preShowStart = data.metadata.preShowStart ? new Date(data.metadata.preShowStart) : data.metadata.preShowStart;
  const mainShowStart = data.metadata.mainShowStart ? new Date(data.metadata.mainShowStart) : data.metadata.mainShowStart;
  const showEnd = data.metadata.showEnd ? new Date(data.metadata.showEnd) : data.metadata.showEnd;

  const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt ?? data.name));
</script>

<svelte:head>
  <title>Merch Messages from {data.metadata.title ?? ""}{data.metadata.title ? " - " : ""}WAN Show {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})} - Whenplane</title>
<!--  <meta name="description" content="{truncateText(textOnly, 500)}"> TODO-->
  <link rel="canonical" href="https://whenplane.com{$page.url.pathname}"/>
  {#if thumbnail}
    <meta property="og:image" content={thumbnail.url}>
  {/if}
</svelte:head>

{#if thumbnail}
  <div class="thumbnail-backdrop" aria-hidden="true">
    <img src={thumbnail.url} alt={thumbnail.text ?? "Thumbnail for this show"}/>
  </div>
{/if}

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/history">History</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/history/show/{data.name}">{showDate.toLocaleDateString(getDateFormatLocale())}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Merch Messages</li>
</ol>

{#if data.mmShow.status === "inprogress"}
  <Socket events={["mm_progress-" + data.mmShow.showId]} on:data={d => {
    lastData = d.detail.data.job;
    invalidateAll().then();
  }} invalidate={false}/>
{/if}

<div class="limit mx-auto px-2">
  <h1>{data.mmShow.title}</h1>
  WAN Show {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})}
  <br>
  <br>
  <br>
  <h2>Merch Messages</h2>
  Hint: Use CTRL + F to search messages in this show, or <a href="/merch-messages">go to the main merch messages page</a> to search merch messages in all shows.
  {#if data.mmShow.status === "inprogress"}
    <br>
    <br>
    <Incomplete/>
    <br>
    <br>
    {#if lastData}
      <div class="text-center mb-8" in:slide>
        <div class="py-1">
          VOD Download<br>
          <progress value={lastData.downloadPercent ?? 0} max={1} style="width: calc(100% - 5em);"/>
          {((lastData.downloadPercent ?? 0) * 100).toFixed(2)}%
        </div>
      </div>
    {/if}

  {/if}
</div>

<br>

<div class="limit-xl mx-auto text-right pb-64">
  {#each data.messages as message}
    <MerchMessage {message} youtubeId={data.metadata?.vods?.youtube}/>
  {/each}
</div>

<div class="limit mx-auto">
  {#if data.mmShow.status === "inprogress"}
    <br>
    <br>
    <Incomplete/>
  {/if}
</div>

<style>
    .thumbnail-backdrop {
        position: absolute;
        top: 0;
        z-index: -1;
        mask: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0));
        height: 35vw;
        overflow-y: hidden;
    }

    .thumbnail-backdrop > img {
        opacity: 25%;
        width: 100vw;
        height: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
    }
</style>