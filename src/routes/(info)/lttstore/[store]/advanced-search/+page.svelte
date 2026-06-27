<script lang="ts">
  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import type { ProductSearchIndex } from "$lib/lttstore/lttstore_types.js";
  import { SearchClient } from "typesense";
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/state";
  import ToolTip from "$lib/ToolTip.svelte";
  import CircleProgress from "$lib/replacements/CircleProgress.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {flip} from "svelte/animate";
  import type {PageProps} from "./$types";

  let { data }: PageProps = $props();

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

  let sortBy = $state("_text_match(buckets: 10):desc,purchasesPerDay:desc");

  let onlyShowAvailable = $state(false);
  let onlyShowInStock = $state(false);

  const minPrice = 0;
  const maxPrice = 59999 + 1

  let filterMinPriceString = $state(minPrice + "");
  let filterMaxPriceString = $state(maxPrice + "");

  let filterMinPrice = $derived(Number(filterMinPriceString));
  let filterMaxPrice = $derived(Number(filterMaxPriceString));

  const productTypeFilters = new Set();


  let waiting = $state(false);
  let searchPromise: Promise<SearchResponse<ProductSearchIndex> | undefined> | undefined = $state();
  let searchResults: SearchResponse<ProductSearchIndex> | undefined = $state();
  let networkError = false;

  let searchText = $state(page.url.searchParams.get("q") || "");

  let productCategories: {count: number, highlighted: string, value: string}[] | undefined = $state();

  const resultsPerPage = 100;

  let greyResults = $state(false);

  function search(text: string, page?: number) {
    const thisSearchFilters = JSON.stringify(searchParams);
    const thisProductTypeFilters = JSON.stringify([...productTypeFilters]);
    searchPromise = searchClient.collections<ProductSearchIndex>("lttstore_products").documents()
      .search({
        q: text || "*",
        query_by: "title,handle,description",
        query_by_weights: "4,2,0",
        text_match_type: "max_weight",
        sort_by: sortBy,
        facet_by: "currentPrice,productType",
        filter_by: "currentPrice:>=" + filterMinPrice + " && currentPrice:<=" + filterMaxPrice +
          (productTypeFilters.size > 0 ?" && productType:=[" + [...productTypeFilters].map(t => "`" + t + "`").join(",") + "]" : "") +
          (onlyShowAvailable ? " && available:=true" : "") +
          (onlyShowInStock ? " && totalStock:>0" : ""),
        page: page ?? 1,
        per_page: resultsPerPage
      }, {cacheSearchResultsForSeconds: 60})
      .then(r => {
        if(r.request_params.q === (searchText || "*") && thisSearchFilters === JSON.stringify(searchParams) && thisProductTypeFilters === JSON.stringify([...productTypeFilters])) {
          searchResults = r as SearchResponse<ProductSearchIndex>;
          greyResults = false;
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

  let searchParams = $derived({
    filterMinPrice,
    filterMaxPrice,
    sortBy,
    onlyShowAvailable,
    onlyShowInStock
  });

  $effect(() => {
    sortBy;
    throttleSearch();
  });
  $effect(() => {
    searchParams;
    searchText;
    throttleSearch();
  });
  $effect(() => {
    if(productTypeFilters.size === 0) {
      productCategories = searchResults?.facet_counts?.[1].counts;
    }
  });
  $effect(() => {
    if(searchText === "") throttleSearch();
  })

  let currentTimeout: number | undefined = undefined;
  let urlTimeout: number | undefined = undefined;
  function throttleSearch() {
    const tmpText = searchText+"";
    waiting = true;
    const thisSearchFilters = JSON.stringify(searchParams)
    const thisProductTypeFilters = JSON.stringify([...productTypeFilters]);
    greyResults = true;
    if(currentTimeout) clearTimeout(currentTimeout);
    currentTimeout = setTimeout(() => {
      if(searchText === tmpText && thisSearchFilters === JSON.stringify(searchParams) && thisProductTypeFilters === JSON.stringify([...productTypeFilters])) {
        waiting = false;
        search(searchText);
        if(urlTimeout) clearTimeout(urlTimeout);
        urlTimeout = setTimeout(() => {
          if(searchText === tmpText && thisSearchFilters === JSON.stringify(searchParams) && thisProductTypeFilters === JSON.stringify([...productTypeFilters])) {
            const url = new URL(window.location.href);
            if(searchText) {
              url.searchParams.set("q", searchText);
            } else {
              url.searchParams.delete("q");
            }
            if(url.toString() !== window.location.href) {
              // window.history.replaceState({}, "", url.toString());
              goto(url.toString(), { noScroll: true, replaceState: false, keepFocus: true } )
            }
          }
        }, 500) as unknown as number;
      }
    }, 50) as unknown as number
  }

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  })
</script>

<svelte:head>
  <title>LTTStore Advanced Search - Whenplane LTTStore Watcher</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/{page.params.store}">LTT Store Watcher ({data.store.storeName})</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb">Advanced Search</li>
</ol>

<div class="relative limit mx-auto p-2 pt-16">
  <input placeholder="Search for products" bind:value={searchText} class="input w-64 p-1 pl-4 inline-block">
  <div class="inline-block relative pl-1">
    {#await searchPromise}
      {#if !waiting && mounted}
        <CircleProgress class="inline-block absolute" size="6"/>
      {/if}
    {/await}
    {#if waiting || !mounted}
      <CircleProgress class="inline-block absolute" size={6}/>
    {/if}
    <span class="opacity-0">
      .
    </span>
  </div>
  <div class="inline-flex min-[650px]:absolute right-0 pr-2 pt-2">
    <select class="input inline-block" bind:value={sortBy}>
      <option value="_text_match(buckets: 10):desc,purchasesPerDay:desc">Purchases Per Day (descending)</option>
      <option value="_text_match(buckets: 10):desc,purchasesPerDay:asc">Purchases Per Day (ascending)</option>
      <option value="_text_match(buckets: 10):desc,purchasesPerHour:desc">Purchases Per Hour (descending)</option>
      <option value="_text_match(buckets: 10):desc,purchasesPerHour:asc">Purchases Per Hour (ascending)</option>
      <option value="_text_match(buckets: 10):desc,currentPrice:desc">Price (descending)</option>
      <option value="_text_match(buckets: 10):desc,currentPrice:asc">Price (ascending)</option>
      <option value="_text_match:desc,purchasesPerDay:desc">Text Search Relevance</option>
    </select>
    <div class="inline-block self-center pl-2">
      <ToolTip id="asc-desc-explanation" popupClasses="w-full">
        descending = highest to lowest<br>
        ascending = lowest to highest<br>
        <br>
        "Text Search Relevance" just means that the search is only <b>sorted</b> by relevance to the search text.<br>
        Other sorting methods will still show results relevant to the text search higher.
      </ToolTip>
    </div>
  </div>
</div>
<div class="container min-[800px]:flex text-center">
  <div class="search-params pr-4 text-left">
    <b class="text-xl">Filters</b><br>
    <br>
    <label class="block">
      <input class="input inline-block" type="checkbox" bind:checked={onlyShowAvailable}>
      <span>Only show available products</span>
    </label>
    <label class="pt-2 block">
      <input class="input inline-block" type="checkbox" bind:checked={onlyShowInStock}>
      <span>Only show in-stock products</span>
    </label>
    <br>
    <hr>
    <br>
    <b>Price</b><br>
    <br>
    <label class="block">
      <span>Min</span><br>
      <input class="inline-block input w-full" type="range" min={minPrice} max={filterMaxPrice-1} bind:value={filterMinPriceString} step="100"/>
      ${filterMinPrice/100}
    </label>
    <br>
    <label class="block">
      <span>Max</span><br>
      <input
        class="inline-block input w-full"
        type="range"
        min={(Math.round((filterMinPrice / 100) * 100) + 100)}
        max={maxPrice}
        bind:value={filterMaxPriceString}
        step="100"
      />
      ${filterMaxPrice/100}
    </label>
    <br>
    <hr>
    <br>
    <b>Category</b><br>
    <br>
    {#if searchResults && productCategories}
      {#each productCategories as category (category.value)}
        <label class="block">
          <input class="input inline-block" type="checkbox" onchange={e => {
            const checked = (e.target as HTMLInputElement)?.checked;

            if(checked) {
              productTypeFilters.add(category.value)
            } else {
              productTypeFilters.delete(category.value)
            }
            throttleSearch();

          }}>
          <span>
            {category.value}
            <span class="chip preset-tonal-primary border border-primary-500 py-0.5 px-1.5 rounded-lg text-white">
              {category.count}
            </span>
          </span>
        </label>
      {/each}
    {/if}
  </div>
  <div class="search-results" class:opacity-60={greyResults}>
    {#if searchResults && searchResults.hits}
      <div class="flex flex-wrap">
        {#each searchResults.hits as hit (hit.document.id)}
          {@const product = JSON.parse(hit.document.product)}
          <div class="inline-flex" animate:flip={{ duration: 200 }}>
            <LTTProductCard product={product} shortTitle={product.shortTitle} available={hit.document.available}/>
          </div>
        {/each}
      </div>
      <br>
      {#if searchResults.hits.length === resultsPerPage}
        {searchResults.found - resultsPerPage} more results hidden. Please narrow your search query.<br>
      {/if}
    {/if}
  </div>
</div>


<style>
    @reference "#app.css";

    .container {
        @apply p-2 pt-8 w-screen mx-auto;
    }
    .search-params {
        display: inline-block;
        vertical-align: top;
        min-width: 300px;
    }
    .search-results {
        display: inline-block;
        width: 100%;
        /*max-width: 1200px;*/
        transition: opacity 0.25s;

        min-height: 90vh;
    }

    .input[type=checkbox] {
        width: 1em;
        height: 1em;
        margin-bottom: 0.1em
    }
</style>