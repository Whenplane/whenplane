<script lang="ts">
  import { SearchClient } from "typesense";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news.ts";
  import {flip} from "svelte/animate";
  import {slide} from "svelte/transition";
  import { page } from "$app/stores";
  import Paginator from "$lib/util/Paginator.svelte";
	import ClockHistory from "svelte-bootstrap-icons/lib/ClockHistory.svelte";
  import { commas } from "$lib/utils.ts";
  import type { MMShow, MMV2TableRow } from "$lib/merch-messages/mm-types.ts";
  import { getClosestWan } from "$lib/timeUtils.ts";

  export let data;

  const searchClient = new SearchClient({
    'nodes': [{
      'host': 'search.ajg0702.us',
      'port': 443,
      'protocol': 'https'
    }],
    // this api key only has access to search, don't worry
    'apiKey': "X2O8v4aft19UDuRyyaLXPPVc6uCSWtMg",
    'connectionTimeoutSeconds': 10
  });

  let waiting = false;
  let searchPromise: Promise<SearchResponse<MMTableRow> | undefined> | undefined;
  let searchResults: SearchResponse<MMTableRow> | undefined;
  let networkError = false;

  let searchLocation: HTMLLabelElement;

  let searchText = "";
  $: {
    let tmpText = searchText+"";
    waiting = true;
    setTimeout(() => {
      if(searchText === tmpText) {
        waiting = false;
        search(searchText);
      }
    }, 200)
  }


</script>
<svelte:head>
  <title>Whenplane Merch Messages</title>
  <meta name="description" content="The Whenplane Merch Message Index is a tool that has processed every WAN show with merch messages, and put them in a searchable index/archive."/>
</svelte:head>

<span class="clear inline-block absolute pointer-events-none" style="z-index: -5;">
  The Whenplane Merch Message Index is a tool that has processed every WAN show that includes merch messages,
  and organized them into an organized and searchable index/archive.<br>
  I hope that this WAN Show Merch Message Archive is helpful to you.
</span>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Merch Messages</li>
</ol>

<div class="limit mx-auto p-2">
  <h1>Merch Message Index</h1>
  <br>
  The Whenplane Merch Message Index is a tool that has processed every WAN show that includes merch messages, and put them in an organized and searchable index.<br>
  To do this, it runs OCR on the parts of the screen that displays merch messages, then indexes them.<br>
  <br>
  <b>If you cannot find your merch message</b> in this index, check the outro screen scroll, as this is the only part that Whenplane does not currently scan.
  <br>
  <br>

  To search for a merch message, please use Whenplane's <a href="/search">WAN Show Search</a> tool.
  Make sure that the "Merch Messages" box is checked when you search for something.


  <br>
  <br>
  <br>


  {#each data.shows as show}
    {@const showDate = getClosestWan(new Date(show.releaseDate), data.alternateStartTimes)}
    {@const thumbnails = data.showThumbnails[show.showId]}
    {@const thumbnail = thumbnails?.maxres ?? thumbnails?.standard ?? thumbnails?.high ?? thumbnails?.medium ?? thumbnails?.default}
    <a class="card flex hidden-link p-2 my-1 relative" href="/history/show/{show.showId}/merch-messages">
      <img class="thumbnail" src={thumbnail?.url} alt="Thumbnail" aria-hidden="true" loading="lazy" width={thumbnail?.width} height={thumbnail?.height}>
      <div class="self-center px-4">
        <span class="font-bold text-lg">
          {show.title}
        </span><br>
        WAN Show {showDate.toLocaleDateString(undefined, {dateStyle: "long"})}<br>
        <span class="text-sm" style="line-height: 0.25em;">
          {#if show.messageCount}
            {commas(show.messageCount)} messages
          {:else}
            &nbsp;
          {/if}
          <br>
          {#if show.replyCount}
            {commas(show.replyCount)} replies
          {:else}
            &nbsp;
          {/if}
        </span>
      </div>
      {#if show.status === "inprogress"}
        <div class="absolute self-center right-5 text-yellow-400">
          <ClockHistory height="32" width="32"/>
        </div>
      {/if}
    </a>
  {/each}
</div>

<style>
    ul {
        list-style: initial;
        padding-left: 1.5em;
    }
    ol {
        list-style: decimal;
        padding-left: 1.5em;
    }
    .thumbnail {
        display: inline-block;
        width: min(12em, 20vw);
        height: auto;
        object-fit: cover;
        border-radius: var(--theme-rounded-base);
        aspect-ratio: 16 / 9;
    }
</style>