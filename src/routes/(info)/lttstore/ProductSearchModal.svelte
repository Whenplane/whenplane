<!-- @migration task: review uses of `navigating` -->
<script lang="ts">
  import { run } from 'svelte/legacy';


  import { SearchClient } from "typesense";
  import type { ProductSearchIndex } from "$lib/lttstore/lttstore_types.ts";
  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import { modalStore, Progress } from "@skeletonlabs/skeleton-svelte";
  import sanitizeHtml from "sanitize-html";
  import {flip} from "svelte/animate";
  import {slide} from "svelte/transition";
  import { goto } from "$app/navigation";
  import { navigating } from "$app/state";
  import { dev } from "$app/environment";

  const searchClient = new SearchClient({
    'nodes': [{
      'host': 'search.ajg0702.us',
      'port': 443,
      'protocol': 'https'
    }],
    // this api key only has access to search, don't worry
    'apiKey': "swyHTJhzz7MQIxDjBqE2dpOCM6DIU10P",
    'connectionTimeoutSeconds': 10
  });

  let waiting = false;
  let searchPromise: Promise<SearchResponse<ProductSearchIndex> | undefined> | undefined = $state();
  let searchResults: SearchResponse<ProductSearchIndex> | undefined = $state();
  let networkError = $state(false);

  function keyPress(event: KeyboardEvent) {
    if(dev) console.debug(event.key)

    if(searchResults?.hits && searchResults.hits.length > 0) {
      if(event.key === "Enter") {
        goto("/lttstore/products/" + searchResults.hits[cursor].document.handle)
      }

      if(event.key === "ArrowUp") {
        event.preventDefault()
        if(cursor > 0) cursor--;
      }
      if(event.key === "ArrowDown") {
        event.preventDefault()
        if(cursor < searchResults.hits.length-1) cursor++;
      }
    }
  }

  let searchText = /*dev ? "screwdriver" :*/ $state("");
  let cursor = $state(0);

  function search(text: string) {
    if(!text) {
      searchPromise = undefined;
      searchResults = undefined;
      return;
    }
    searchPromise = searchClient.collections<ProductSearchIndex>("lttstore_products").documents()
      .search({
        q: text,
        query_by: "title,handle,description",
        query_by_weights: "4,2,0",
        text_match_type: "max_weight",
        page: 1,
        per_page: 20
      }, {cacheSearchResultsForSeconds: 60})
      .then(r => {
        if(r.request_params.q === searchText) {
          cursor = 0;
          searchResults = r as SearchResponse<ProductSearchIndex>;
          networkError = false;
        }
        return r as SearchResponse<ProductSearchIndex>;
      })
      .catch(e => {
        console.error("Error while searching:", e);
        searchResults = undefined;
        networkError = true;
        return undefined;
      })
  }



  run(() => {
    search(searchText);
  });
  run(() => {
    if(navigating) modalStore.close();
  }); // close search modal when we navigate
</script>

<div class="s-container p-4 absolute">
  <input class="input px-2 pl-4 py-0.5" autofocus placeholder="Find a product" bind:value={searchText} onkeydown={keyPress}>
  <div class="inline-block absolute top-4 right-8">
    {#if waiting}
      <Progress class="inline-block" width="w-6" stroke={250}/>
    {/if}
    {#await searchPromise}
      {#if !waiting}
        <Progress class="inline-block" width="w-6" stroke={250}/>
      {/if}
    {/await}
  </div>
  <div class="results">
    {#if searchResults && searchResults.hits}
      {#each searchResults.hits as result, i (result.document.id)}
        {@const productData = JSON.parse(result.document.product)}
        {@const descriptionSnippet = result.highlight?.description?.snippet?.replaceAll("</p>", "\n")}
        {@const openingIndex = descriptionSnippet?.indexOf("<")}
        {@const closingIndex = descriptionSnippet?.indexOf(">")}
        <a class="block card p-2 m-1 truncate rounded-xl" class:selected={cursor === i} href="/lttstore/products/{result.document.handle}" animate:flip={{ duration: 50 }} transition:slide>
          <img src={productData.featured_image ?? productData.images[0]} class="inline-block h-8 w-8 rounded-md">
          <span class="result-highlight" class:line-through={!(result.document.available ?? true)}>
          {@html sanitizeHtml(result.highlight?.title?.snippet ?? result.document.title, {allowedTags: ["mark"]})}
        </span>
           
          <span class="opacity-70 max-w-full truncate result-highlight">
          <!--{descriptionSnippet}-->
            {@html
              sanitizeHtml(
                descriptionSnippet
                  ?.substring( // we trim this so that if typesense starts the snippet in the middle of a html tag, we can remove that
                    closingIndex && openingIndex &&
                    closingIndex >= 0 &&
                    (
                      openingIndex >= 0 ? openingIndex > closingIndex : true
                    )
                      ?
                      closingIndex+1 :
                      0
                  ) ??
                productData.description,
                {allowedTags: ["mark"]}
              )}
        </span>
          <br>
        </a>
      {:else}
        No results found.
      {/each}
    {/if}
  </div>
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
  input {
      max-width: 100%;

  }

  .results {
      font-size: 1rem;
  }

  .s-container {
      overflow: hidden;
      overflow-y: auto;
      max-width: 60vw;
      max-height: 90vh;
      font-size: 2.5rem;
  }

  @media (max-width: 1000px) {
      .s-container {
          max-width: 95vw;
      }
  }

  .result-highlight > :global(mark) {
      /*background-color: rgb(var(--color-primary-500) / 0.4);*/
      background-color: inherit;
      color: inherit;
      font-weight: bold;
  }

  .selected {
      border: 1px yellow solid;
  }
</style>