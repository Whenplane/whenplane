<script lang="ts">
  import { getClosestWan, getTimeUntil, timeString } from "$lib/timeUtils.ts";
  import { commas, type MMJobData, truncateText } from "$lib/utils.ts";
  import { getDateFormatLocale } from "$lib/prefUtils.ts";
  import { page } from "$app/state";
  import MerchMessage from "./components/MerchMessage.svelte";
  import Incomplete from "$lib/merch-messages/Incomplete.svelte";
  import { invalidateAll } from "$app/navigation";
  import Socket from "$lib/Socket.svelte";
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { slide } from "svelte/transition";
  import ToolTip from "$lib/ToolTip.svelte";

  let { data } = $props();

  let lastData: MMJobData = $state();

  onMount(() => {
    if(dev && page.params.videoId === "test") {
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

  const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt ?? data.name), data.alternateStartTimes);

  const preShowLength = preShowStart && mainShowStart ?
    getTimeUntil(mainShowStart as Date, (preShowStart as Date).getTime()).distance :
    null;
  const mainShowLength = mainShowStart && showEnd ?
    getTimeUntil(showEnd as Date, (mainShowStart as Date).getTime()).distance :
    null;

  let biggestTimestamp = $derived(data.messages.reduce((a, b) => Math.max(a, b.timestamp), 0));
  const latestJobId = data.messages.map(m => m.jobId).sort().reverse()[0];
</script>

<svelte:head>
  <title>Merch Messages from {data.metadata.title ?? ""}{data.metadata.title ? " - " : ""}WAN Show {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})} - Whenplane</title>
  <meta name="description" content="Whenplane found {commas(data.mmShow.messageCount)} merch messages and {commas(data.mmShow.replyCount)} replies from this show.">
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
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
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
  <span>
    Hint: Use CTRL + F to search messages in this show, or use Whenplane's <a href="/search">WAN Show Search</a> tool to search for messages in all shows.
    Make sure that the "Merch Messages" box is checked when you search for something.
  </span>
  {#if data.mmShow.status === "inprogress"}
    {@const percent = Math.max(lastData?.downloadPercent ?? 0, preShowLength && mainShowLength ? ( (biggestTimestamp*1e3) / (preShowLength + mainShowLength)) : 0)}
    <br>
    <br>
    <Incomplete/>
    <br>
    <br>
    <div class="text-center mb-8" in:slide>
      <div class="py-1">
        Show Processing Completion
        <ToolTip id="mm-progress-{data.name}">
          If this show is currently live, this progress bar being near (or close to) 100% means the processing is caught up to the livestream.
          If it is live and well under 100%, that means Whenplane is currently behind the livestream. This will usually be around 99%, as if Whenplane gets too far behind it might miss parts of the show.
          <br>
          If this show already happened, this bar is how far through the show the MM reader is.
          50% means Whenplane is halfway through watching the show.

        </ToolTip>
        <br>
        <progress value={percent} max={1} style="width: calc(100% - 5em);"></progress>
        {(percent * 100).toFixed(2)}%
      </div>
    </div>

  {/if}
</div>

<br>

<div class="limit-xl mx-auto text-right pb-64">
  {#each data.messages as message}
    <div class:opacity-40={latestJobId !== message.jobId}>
      <MerchMessage {message} youtubeId={data.metadata?.vods?.youtube} floatplaneId={data.metadata?.vods?.floatplane} source={data.mmShow.vodSource} preShowLength={preShowLength}/>
    </div>
  {/each}
</div>

<div class="limit mx-auto pb-32">
  {#if data.mmShow.status === "inprogress"}
    <br>
    <br>
    <Incomplete/>
  {/if}
</div>
<br>
<div class="p-4">
  <span class="text-sm opacity-60">
    Whenplane and the Whenplane Merch Messages Index is not affiliated with or endorsed by Linus Media Group.
  </span>
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