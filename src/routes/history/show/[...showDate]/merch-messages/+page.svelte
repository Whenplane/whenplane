<script lang="ts">
  import { getClosestWan } from "$lib/timeUtils.ts";
  import { truncateText } from "$lib/utils.ts";
  import { getDateFormatLocale } from "$lib/prefUtils.ts";
  import { page } from "$app/stores";
  import MerchMessage from "./components/MerchMessage.svelte";

  export let data;

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

<div class="limit-xl mx-auto text-right">
  {#each data.messages as message}
    <MerchMessage {message} youtubeId={data.metadata.youtubeId}/>
  {/each}
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