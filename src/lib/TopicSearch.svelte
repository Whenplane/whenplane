<script lang="ts">

  import { SearchClient } from "typesense";
  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import sanitizeHtml from "sanitize-html";
  import {flip} from "svelte/animate";
  import { slide } from "svelte/transition";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import type { TimestampsDbRow } from "$lib/timestamps/types.ts";
  import MiniShow from "$lib/history/MiniShow.svelte";

  const searchClient = new SearchClient({
    'nodes': [{
      'host': 'search.ajg0702.us',
      'port': 443,
      'protocol': 'https'
    }],
    // this api key only has access to search, don't worry
    'apiKey': "AdXAmPk7dwQJHdpIx7sAA1Fmil2WHoRi",
    'connectionTimeoutSeconds': 10
  });

  let waiting = false;
  let searchPromise: Promise<SearchResponse<TimestampsDbRow> | undefined> | undefined;
  let searchResults: SearchResponse<TimestampsDbRow> | undefined;
  let networkError = false;

  let searchText = "dan";
  $: {
    let tmpText = searchText+"";
    waiting = true;
    setTimeout(() => {
      if(searchText === tmpText) {
        waiting = false;
        search(searchText);
      }
    }, 100)
  }

  const resultsPerPage = 100;

  function search(text: string, page?: number) {
    if(!text) {
      searchPromise = undefined;
      searchResults = undefined;
      return;
    }
    searchPromise = searchClient.collections<TimestampsDbRow>("whenplane-timestamps").documents()
      .search({
        q: text,
        query_by: "name",
        page: page ?? 1,
        per_page: resultsPerPage
      }, {cacheSearchResultsForSeconds: 60})
      .then(r => {
        if(r.request_params.q === searchText) {
          searchResults = r as SearchResponse<TimestampsDbRow>
        }
        return r as SearchResponse<TimestampsDbRow>;
      })
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

<div class="p-2 mx-auto">
  <div class="limit mx-auto my-4">
    <input placeholder="Search for topics" bind:value={searchText} class="input w-64 p-2 pl-4">
    <div class="inline-block w-12">
      {#await searchPromise}
        {#if !waiting}
          <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
        {/if}
      {/await}
      {#if waiting}
        <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
      {/if}
    </div>
  </div>

  {#if searchResults && searchResults.hits}
    <table class="table table-hover">
      <thead>
        <tr>
          <td class="px-2">Show</td>
          <td></td>
          <td class="px-2">Timestamp YT Link</td>
        </tr>
      </thead>
      <tbody>
      {#each searchResults.hits as result (result.document.id)}
          <tr animate:flip={{ duration: 50 }} transition:slide>
            <td class="limit-show-width">
              <a class="hidden-link truncate" href="/history/show/{result.document.videoId}?hash={encodeURIComponent('#timestamp-' + result.document.id)}">
                <MiniShow showName={result.document.videoId}/>
              </a>
            </td>
            <td>
              <a class="hidden-link block truncate result-highlight" href="/history/show/{result.document.videoId}?hash={encodeURIComponent('#timestamp-' + result.document.id)}">
                {@html sanitizeHtml(result.highlight?.name?.snippet ?? result.document.name, {allowedTags: ["mark"]})}
              </a>
            </td>
            <td class="text-right">
              <a
                href="https://youtube.com/watch?v={result.document.videoId}&t={result.document.time}"
                target="_blank" rel="noopener"
              >
                {result.document.timeString}
              </a>
            </td>
          </tr>
      {:else}
        No results found.
      {/each}
      </tbody>
    </table>
    {#if searchResults.hits.length === resultsPerPage}
      {searchResults.found - resultsPerPage} more results hidden. Please narrow your search query.<br>
    {/if}
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
</div>

<style>
    .result-highlight > :global(mark) {
        /*background-color: rgb(var(--color-primary-500) / 0.4);*/
        background-color: inherit;
        color: inherit;
        font-weight: bold;
    }
    .limit-show-width {
        max-width: 15vw;
    }
</style>