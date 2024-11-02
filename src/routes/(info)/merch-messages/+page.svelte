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


  const resultsPerPage = 50;

  function search(text: string, page?: number) {
    if(!text) {
      searchPromise = undefined;
      searchResults = undefined;
      return;
    }
    searchPromise = searchClient.collections<MMTableRow>("merch_messages").documents()
      .search({
        q: text,
        query_by: "text",
        page: page ?? 1,
        per_page: resultsPerPage
      }, {cacheSearchResultsForSeconds: 60})
      .then(r => searchResults = r as SearchResponse<MMTableRow>)
      .then(r => {
        networkError = false;
        return r;
      })
      .catch(e => {
        console.error("Error while searching:", e);
        searchResults = undefined;
        networkError = true;
        return undefined;
      })
  }

</script>
<svelte:head>
  <title>Whenplane Merch Messages</title>
  <meta name="description" content="The Whenplane Merch Message Index is a tool that has processed nearly every WAN show that includes merch messages, and organized them into an organized and searchable index."/>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Merch Messages</li>
</ol>

<div class="limit mx-auto p-2">
  <h1>Merch Message Index</h1>
  <br>
  The Whenplane Merch Message Index is a tool that has processed nearly every WAN show that includes merch messages, and organized them into an organized and searchable index.<br>
  To do this, it runs OCR on the part of the screen that displays merch messages, then indexes them.<br>
  <br>
  If you cannot find your merch message in this index, here are a few places to search:<br>
  <ul>
    <li>When they are screen sharing</li>
    <li>The outro</li>
  </ul>
  Whenplane does not currently read merch messages that only show up in these places,
  because they are in a different part of the screen, and I have not yet written the code to process multiple parts of the screen.<br>
  For some older WAN shows, the merch messages are only at the top of the screen,
  so if you are looking for a really old merch message, you might not be able to find it here until I eventually finish the code to read other parts of the screen.
  <br>
  <br>

  <label bind:this={searchLocation}>
    Search
    <input class="input w-64 py-1 px-2 inline-block" placeholder="Search Terms" bind:value={searchText}>
    {#await searchPromise}
      {#if !waiting}
        <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
      {/if}
    {/await}
    {#if waiting}
      <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
    {/if}
    <br>
    {#if searchResults && searchResults.hits}
      <h3>Search Results ({searchResults.found})</h3>
      <div class="text-right">
        <Paginator
          totalPages={Math.ceil(searchResults.found / resultsPerPage)}
          currentPage={searchResults.page}
          on:page={e => {
            search(searchText, e.detail.page);
          }}
        />
      </div>
      <table class="table rounded-sm">
        <thead>
          <tr>
            <td>Date</td>
            <td>Type</td>
            <td>Name</td>
            <td>Message Fragment</td>
            <td>Link</td>
          </tr>
        </thead>
        <tbody>
        {#each searchResults.hits as hit (hit.document.id)}
          {@const releaseEpoch = data.videoReleaseDates[hit.document.video]}
          <tr animate:flip={{ duration: 100 }} transition:slide|local class="bg-surface-900">
            <td>{releaseEpoch ? new Date(releaseEpoch).toLocaleDateString(undefined, {dateStyle: "medium"}) : ""}</td>
            <td>{hit.document.type}</td>
            <td>{hit.document.name}</td>
            <td>{@html sanitizeHtml((hit.highlight.text?.snippet ?? hit.highlight.name?.snippet)+"", newsSanitizeSettings)}</td>
            <td><a href="merch-messages/{hit.document.video}#{hit.document.id}">Link</a></td>
          </tr>
        {/each}
        </tbody>
      </table>
      <div class="text-right">
        <Paginator
          totalPages={Math.ceil(searchResults.found / resultsPerPage)}
          currentPage={searchResults.page}
          on:page={e => {
            search(searchText, e.detail.page);
            searchLocation.scrollIntoView({behavior: "smooth"})
          }}
        />
      </div>
    {/if}
    {#if networkError}
      <span class="text-error-500">
        <br>
        A network error occurred while trying to get the results for your search.<br>
        Check your internet connection.<br>
        If your network connection is fine, the search server might be down.
        Try again in a few minutes, and <a href="/support">contact me</a> if it is still down.
      </span>
    {/if}
  </label>


  <br>
  <br>
  <br>


  {#each data.videos as video}
    {@const firstTitleParts = video.title.split(" - ")}
    {@const lastTitlePart = firstTitleParts.pop()}
    <a class="card flex hidden-link p-2 my-1" href="merch-messages/{video.videoId}">
      <img class="thumbnail" src="https://i.ytimg.com/vi/{video.videoId}/mqdefault.jpg" alt="Thumbnail" aria-hidden="true" loading="lazy">
      <div class="self-center px-4">
        <span class="font-bold text-lg">
          {firstTitleParts.join(" - ")}
        </span><br>
        {lastTitlePart}<br>
        {video.messageCount} messages
      </div>
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