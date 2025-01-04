<script lang="ts">
  import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";
  import { getClosestWan, getUTCDate } from "$lib/timeUtils.ts";
  import { page } from "$app/stores";
  import Socket from "$lib/Socket.svelte";
  import type { MMJobData } from "$lib/utils.ts";
  import { dev } from "$app/environment";
  import {slide} from "svelte/transition";
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";

  export let data;

  $: titleParts = data.video.title.split("- WAN Show");

  $: wanDate = data.video.title.includes("- WAN Show") ? getClosestWan(new Date(titleParts[titleParts.length - 1])) : undefined;
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
</script>

<svelte:head>
  <title>{data.video.title} - Whenplane Merch Messages</title>
</svelte:head>

{#if data.video.status === "inprogress"}
  <Socket events={["mm_progress-" + data.video.videoId]} on:data={d => {
    console.debug({d})
    lastData = d.data;
    if(typeof lastData.progressAt !== "undefined") {
      invalidateAll();
    }
  }} invalidate={false}/>
{/if}

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/merch-messages">Merch Messages</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{data.video.title}</li>
</ol>

<div class="limit mx-auto">
  <svelte:element this={wanDate ? "a" : "span"} class="!text-white !no-underline" href={wanDate ? "/history/show/" + getUTCDate(wanDate) : undefined}>
    <h1>{titleParts.length === 1 ? data.video.title : titleParts[0]}</h1>
    {#if titleParts.length !== 1}
      {titleParts.slice(1).join("- WAN Show")}
    {/if}
  </svelte:element>
  <br>
  <br>
  <h2>Merch Messages</h2>
  Hint: Use CTRL + F to search messages in this show, or <a href="/merch-messages">go back</a> to search merch messages in all shows.
  {#if data.video.status === "inprogress"}
    <br>
    <br>
    <span class="text-amber-300">
      Merch messages for this episode are incomplete.
    </span><br>
    They may still be processing. You can view the ones we have so far, or come back later for the complete list.
    <br>
    <br>
    {#if lastData}
      <div class="text-center mb-8" in:slide>
        <div class="py-1">
          VOD Download<br>
          <progress value={lastData.downloadPercent ?? 0} max={1} style="width: calc(100% - 5em);"/>
          {((lastData.downloadPercent ?? 0) * 100).toFixed(2)}%
        </div>
        <div class="py-1">
          VOD pre-process<br>
          <progress value={lastData.preProcessPercent ?? 0} max={1} style="width: calc(100% - 5em);"/>
          {((lastData.preProcessPercent ?? 0) * 100).toFixed(2)}%
        </div>
        <div class="py-1">
          Frame Extraction<br>
          <progress value={lastData.frameExtractPercent ?? 0} max={1} style="width: calc(100% - 5em);"/>
          {((lastData.frameExtractPercent ?? 0) * 100).toFixed(2)}%
        </div>
        <div class="py-1">
          Frame reading<br>
          <progress value={lastData.progressAt ?? 0} max={lastData.progressTotal ?? 1} style="width: calc(100% - 5em);"/>
          {(((lastData.progressAt ?? 0) / (lastData.progressTotal ?? 1)) * 100).toFixed(2)}%
        </div>
      </div>
    {/if}

  {/if}
</div>

<div class="mx-auto pb-64">
  <table class="table rounded-none">
    <thead class="sticky top-0">
    <td>Name</td>
    <td>Type</td>
    <td>Text</td>
    <td>Timestamp</td>
    <td>Image</td>
    </thead>
    <tbody>
    {#each data.messages as message, i}
      <tr id={message.id} class:hashHighlight={$page.url.hash === "#" + message.id}>
        <td>{message.name}</td>
        <td>{message.type}</td>
        <td>{message.text}</td>
        <td><a href="https://youtu.be/{data.video.videoId}?t={(message.imageIndex*5)-5}">Timestamp</a></td>
        <td>
          {#if i > 10}
            <LargerLazyLoad>
              <img src="https://merch-message-images.whenplane.com/{message.video}/images/img{message.imageIndex}.jpg" width="1000" height="200">
            </LargerLazyLoad>
          {:else}
            <img src="https://merch-message-images.whenplane.com/{message.video}/images/img{message.imageIndex}.jpg" width="1000" height="200">
          {/if}
        </td>
      </tr>
    {/each}
    </tbody>
  </table>
  <div class="limit mx-auto">
    {#if data.video.status === "inprogress"}
      <br>
      <br>
      <span class="text-amber-300">
      Merch messages for this episode are incomplete.
    </span><br>
      They may still be processing. You can view the ones we have so far, or come back later for the complete list.
    {/if}
  </div>
</div>

<style>
  .hashHighlight {
      border: #d4163c 2px solid;
      border-radius: 12px;
  }
</style>