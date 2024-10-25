<script lang="ts">
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import MiniSearch from "minisearch";
  import {flip} from "svelte/animate";
  import {slide, fade} from "svelte/transition";
  import {ProgressRadial} from "@skeletonlabs/skeleton";
  import { invalidateAll } from "$app/navigation";
  import { SearchClient } from "typesense";
  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";
  import type { ProductSearchIndex } from "$lib/lttstore/lttstore_types.ts";
  import { escapeHtml } from "$lib/utils.ts";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news.ts";

  export let data;

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
  let searchPromise: Promise<SearchResponse<ProductSearchIndex> | undefined> | undefined;
  let searchResults: SearchResponse<ProductSearchIndex> | undefined;
  let networkError = false;

  let searchText = "";
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
    searchPromise = searchClient.collections<ProductSearchIndex>("lttstore_products").documents()
      .search({
        q: text,
        query_by: "title,handle,description",
        query_by_weights: "4,2,0",
        text_match_type: "max_weight",
        page: page ?? 1,
        per_page: resultsPerPage
      }, {cacheSearchResultsForSeconds: 60})
      .then(r => {
        if(r.request_params.q === searchText) {
          searchResults = r as SearchResponse<ProductSearchIndex>
        }
        return r as SearchResponse<ProductSearchIndex>;
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

  let loading = false;
  async function reload() {
    loading = true;
    await invalidateAll()
    loading = false;
  }
</script>
<svelte:head>
  <title>LTTStore Watcher - Whenplane</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb" on:click={reload}>LTT Store Tracker</li>
  {#if loading}
    <li class="crumb" transition:fade|global={{duration: 100}}>
      <ProgressRadial width="w-6" stroke={250} value={loading ? undefined : 100}/>
    </li>
  {/if}
</ol>


<div class="container mx-auto pt-8 mb-64 px-2">

  <input placeholder="Search for products" bind:value={searchText} class="input w-64 p-2 pl-4">
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
    {#each searchResults.hits as result (result.document.id)}
      {@const productData = JSON.parse(result.document.product)}
      {@const descriptionSnippet = result.highlight?.description?.snippet?.replaceAll("</p>", "\n")}
      {@const openingIndex = descriptionSnippet?.indexOf("<")}
      {@const closingIndex = descriptionSnippet?.indexOf(">")}
      <a class="block card p-2 m-1 truncate" href="/lttstore/products/{result.document.handle}" animate:flip={{ duration: 50 }} transition:slide>
        <img src={productData.featured_image ?? productData.images[0]} class="inline-block h-8 w-8 rounded-md">
        <span class:line-through={!(result.document.available ?? true)}>
          {result.document.title}
        </span>
        &nbsp;
        <span class="opacity-70 max-w-full truncate description-results">
          <!--{descriptionSnippet}-->
          {@html
            sanitizeHtml(
              descriptionSnippet
                  ?.substring(
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
            )
          }
        </span>
        <br>
      </a>
    {:else}
      No results found.
    {/each}
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
  <br>


  {#if data.newProducts.length > 0}
    <h1>New products</h1>
    <div class="opacity-80 pl-2">
      These products are new.
    </div>
    {#each data.newProducts as product}
      <LTTProductCard product={JSON.parse(product.product)} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
    {/each}
    <br>
    <br>
  {/if}

  <h1>Popular Products</h1>
  <div class="opacity-80 pl-2">
    From the past few hours
  </div>
  {#each data.popularProducts as product (product.id)}
    <div class="inline-block" animate:flip={{ duration: 200 }}>
      <LTTProductCard product={JSON.parse(product.product)}/>
    </div>
  {:else}
    No products are being tracked yet!
  {/each}
  <br>
  <br>

  {#if data.onSale.length > 0}
    <h1>On Sale</h1>
    <div class="opacity-80 pl-2">
      These products are currently on sale. (excludes items that are out of stock)
    </div>
    {#each data.onSale as product}
      <LTTProductCard product={JSON.parse(product.product)} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
    {/each}
    <br>
    <br>
  {/if}

  {#if data.lowStock.length > 0}
    <h1>Low Stock</h1>
    <div class="opacity-80 pl-2">
      These items are low in stock and selling fast enough to possibly run out of stock soon.
    </div>
    {#each data.lowStock as product}
      <LTTProductCard product={JSON.parse(product.product)} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
    {/each}
    <br>
    <br>
  {/if}

  {#if data.recentRestocks.length > 0}
    <h1>Recently Re-stocked</h1>
    <div class="opacity-80 pl-2">
      These items have been restocked in the past 6 days.
    </div>
    {#each data.recentRestocks as product}
      <LTTProductCard product={JSON.parse(product.product)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
    {/each}
    <br>
    <br>
  {/if}

  <br>
  <br>
  <a href="/lttstore/products" class="btn variant-filled-secondary">All products</a><br>
  <br>
  <br>
  Join the <a data-sveltekit-reload href="/discord">discord</a> where there is a channel that can alert you to useful info! (e.g. new products, sales, restocks)
</div>

<style>
  .description-results > :global(mark) {
      /*background-color: rgb(var(--color-primary-500) / 0.4);*/
      background-color: inherit;
      color: inherit;
      font-weight: bold;
  }
</style>