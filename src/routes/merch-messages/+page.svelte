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
  let searchPromise: Promise<SearchResponse<MMTableRow>> | undefined;
  let searchResults: SearchResponse<MMTableRow> | undefined;

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

  function search(text: string) {
    if(!text) {
      searchPromise = undefined;
      searchResults = undefined;
      return;
    }
    searchPromise = searchClient.collections<MMTableRow>("merch_messages").documents()
      .search({
        q: text,
        query_by: "text",
        per_page: 100
      }, {cacheSearchResultsForSeconds: 60}).then(r => searchResults = r as SearchResponse<MMTableRow>) as Promise<SearchResponse<MMTableRow>>
  }

</script>
<svelte:head>
  <title>Whenplane Merch Messages</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Merch Messages</li>
</ol>

<div class="limit mx-auto">
  <h1>Merch messages</h1>

  <label>
    Search
    <input class="input w-64 py-1 px-2 inline-block" placeholder="Search Terms" bind:value={searchText}>
    {#await searchPromise}
      <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
    {/await}
    {#if waiting}
      <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
    {/if}
    <br>
    {#if searchResults && searchResults.hits}
      <h3>Search Results ({searchResults.found})</h3>
      <table class="table rounded-sm">
        <thead>
          <tr>
            <td>Type</td>
            <td>Name</td>
            <td>Message</td>
            <td>Link</td>
          </tr>
        </thead>
        <tbody>
        {#each searchResults.hits as hit (hit.document.id)}
          <tr animate:flip={{ duration: 100 }} transition:slide|local class="bg-surface-900">
            <td>{hit.document.type}</td>
            <td>{hit.document.name}</td>
            <td>{@html sanitizeHtml((hit.highlight.text?.snippet ?? hit.highlight.name?.snippet)+"", newsSanitizeSettings)}</td>
            <td><a href="/merch-messages/{hit.document.video}#{hit.document.id}">Link</a></td>
          </tr>
        {/each}
        </tbody>
      </table>
    {/if}
  </label>


  <br>
  <br>
  <br>


  {#each data.videos as video}
    <a class="card block hidden-link p-2 my-1" href="/merch-messages/{video.videoId}">
      {video.title}
    </a>
  {/each}
</div>