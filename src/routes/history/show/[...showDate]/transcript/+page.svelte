<script lang="ts">
  import { escapeHtml } from "$lib/utils.ts";
  import { getClosestWan } from "$lib/timeUtils.ts";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  export let data;

  let text = "";
  let textOnly = "";
  let matchIndex = -1;
  function parseText() {
    text = "";
    textOnly = "";
    const find = $page.url.searchParams.get("find")
    const matchLength = find?.length ?? 0;
    let startedMatch = false;
    let endedMatch = true;
    let processed = 0;
    for (let event of data.transcript.events) {
      if(!event.segs) continue;
      if(browser || processed++ < 100) {
        for (let seg of event.segs) {
          if(!seg.utf8) continue;
          let time = Math.floor((event.tStartMs + (seg.tOffsetMs ?? 0)) / 1e3);
          let currentIndex = textOnly.length;
          if(browser) textOnly += seg.utf8;
          const isMatch = matchIndex !== -1 && currentIndex >= matchIndex && currentIndex <= (matchIndex + matchLength);
          if(isMatch && !startedMatch) {
            console.debug("Starting match at", currentIndex, "for", matchIndex)
            startedMatch = true;
            text += `<span class="match" id="match">`;
            endedMatch = false;
          }
          if(!isMatch && !endedMatch) {
            console.debug("Ending match at", currentIndex, "for", matchIndex)
            endedMatch = true;
            text += `</span>`;
          }
          text +=
            `<a href="https://youtube.com/watch?v=${data.videoId}&t=${time}" class="hidden-link underline" target="_blank" rel="noopener">` +
            escapeHtml(seg.utf8).replaceAll("\n", "<br>\n") +
            `</a>`;
        }
      } else {
        text += "<br><span class='opacity-70'>Please wait for your browser to load the rest..</span>";
        break;
      }
    }
    if(find) {
      matchIndex = textOnly.indexOf(find);
      console.log("Found match at", matchIndex)
    }
  }
  if(!browser) parseText();
  onMount(() => {
    parseText();
    if($page.url.searchParams.has("find") && matchIndex !== -1) parseText();
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
  <li class="crumb"><a class="anchor hover-underline" href="/history/show/{data.name}">{showDate.toLocaleDateString()}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Transcript</li>
</ol>

<div class="mx-auto limit mb-64">
  <div class="text-center">
    <h1>{showDate.toLocaleDateString(undefined, {dateStyle: "long"})}</h1>
    {#if thumbnail}
      <br>
      <img class="thumbnail" src={thumbnail.url} alt={thumbnail.text ?? "Thumbnail for this show"} title={thumbnail.text ?? "Thumbnail for this show"}/>
    {/if}
    {#if data.metadata.title}
      <h2>{data.metadata.title}</h2>
    {/if}
    <br>
    <br>
    <h3>Transcript</h3>
    <div class="mx-auto inline-block text-left">
      {@html text}
    </div>
  </div>
</div>

<style>
    .thumbnail {
        height: min(15em, 50vw);
        @apply mx-auto;
        object-fit: cover;
        border-radius: 8px;
        aspect-ratio: 16 / 9;
    }

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

    :global(.match) {
        background-color: rgb(var(--color-primary-800));
    }
</style>