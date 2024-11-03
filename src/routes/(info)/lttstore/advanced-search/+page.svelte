<script lang="ts">

  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import type { ProductSearchIndex } from "$lib/lttstore/lttstore_types.ts";
  import { SearchClient } from "typesense";
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { page } from "$app/stores";
  import ToolTip from "$lib/ToolTip.svelte";

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

  let sortBy = "_text_match(buckets: 10):desc,purchasesPerDay:desc";
  $: {
    sortBy;
    throttleSearch();
  }

  let onlyShowAvailable = false;
  let onlyShowInStock = false;

  const minPrice = 0;
  const maxPrice = 59999 + 1

  let filterMinPrice = minPrice;
  let filterMaxPrice = maxPrice;

  let filterMinPriceString = filterMinPrice + "";
  $: filterMinPrice = Number(filterMinPriceString);
  let filterMaxPriceString = filterMaxPrice + "";
  $: filterMaxPrice = Number(filterMaxPriceString);

  $: searchParams = {
    filterMinPrice,
    filterMaxPrice,
    sortBy,
    onlyShowAvailable,
    onlyShowInStock
  }
  const productTypeFilters = new Set();


  let waiting = false;
  let searchPromise: Promise<SearchResponse<ProductSearchIndex> | undefined> | undefined;
  let searchResults: SearchResponse<ProductSearchIndex> | undefined;
  let networkError = false;

  let searchText = "";
  $: {
    searchParams;
    searchText;
    throttleSearch();
  }

  let productCategories: {count: number, highlighted: string, value: string}[] | undefined;
  $: productCategories = productTypeFilters.size === 0 ? searchResults?.facet_counts?.[1].counts : productCategories;

  function throttleSearch() {
    let tmpText = searchText+"";
    waiting = true;
    const thisSearchFilters = JSON.stringify(searchParams)
    const thisProductTypeFilters = JSON.stringify([...productTypeFilters]);
    greyResults = true;
    setTimeout(() => {
      if(searchText === tmpText && thisSearchFilters === JSON.stringify(searchParams) && thisProductTypeFilters === JSON.stringify([...productTypeFilters])) {
        waiting = false;
        search(searchText);
      }
    }, 50)
  }

  const resultsPerPage = 100;

  let greyResults = false;

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

</script>

<svelte:head>
  <title>LTTStore Advanced Search - Whenplane LTTStore Watcher</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Tracker</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Advanced Search</li>
</ol>

<div class="relative limit mx-auto p-2 pt-16">
  <input placeholder="Search for products" bind:value={searchText} class="input w-64 p-2 pl-4">
  {#await searchPromise}
    {#if !waiting}
      <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
    {/if}
  {/await}
  {#if waiting}
    <ProgressRadial class="inline-block" width="w-6" stroke={250}/>
  {/if}
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
    <label>
      <input class="input" type="checkbox" bind:checked={onlyShowAvailable}>
      <span>Only show available products</span>
    </label>
    <label class="pt-2">
      <input class="input" type="checkbox" bind:checked={onlyShowInStock}>
      <span>Only show in-stock products</span>
    </label>
    <br>
    <hr>
    <br>
    <b>Price</b><br>
    <br>
    <label>
      <span>Min</span><br>
      <input class="inline-block input w-full" type="range" min={minPrice} max={filterMaxPrice-1} bind:value={filterMinPriceString} step="100"/><br>
      {filterMinPrice/100}
    </label>
    <br>
    <label>
      <span>Max</span><br>
      <input class="inline-block input w-full" type="range" min={(Math.round((filterMinPrice / 100) * 100) + 100)} max={maxPrice} bind:value={filterMaxPriceString} step="100"/><br>
      {filterMaxPrice/100}
    </label>
    <br>
    <hr>
    <br>
    <b>Category</b><br>
    <br>
    {#if searchResults && productCategories}
      {#each productCategories as category (category.value)}
        <label>
          <input class="input" type="checkbox" on:change={e => {
            const checked = (e.target)?.checked;

            if(checked) {
              productTypeFilters.add(category.value)
            } else {
              productTypeFilters.delete(category.value)
            }
            throttleSearch();

          }}>
          <span>
            {category.value} <span class="chip variant-ghost-primary py-0.5 px-1.5 rounded-lg">{category.count}</span>
          </span>
        </label>
      {/each}
    {/if}
  </div>
  <div class="search-results" class:opacity-60={greyResults}>
    {#if searchResults && searchResults.hits}
      {#each searchResults.hits as hit (hit.document.id)}
        {@const product = JSON.parse(hit.document.product)}
        <div class="inline-block">
          <LTTProductCard product={product} available={hit.document.available}/>
        </div>
      {/each}
      <br>
      {#if searchResults.hits.length === resultsPerPage}
        {searchResults.found - resultsPerPage} more results hidden. Please narrow your search query.<br>
      {/if}
    {/if}
  </div>
</div>


<style>
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