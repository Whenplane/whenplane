<script lang="ts">
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import MiniSearch from "minisearch";
  import {flip} from "svelte/animate";
  import {slide, fade} from "svelte/transition";
  import {ProgressRadial} from "@skeletonlabs/skeleton";
  import { invalidateAll } from "$app/navigation";

  export let data;

  let miniSearch;

  onMount(() => {
    miniSearch = new MiniSearch({
      fields: ["handle", "title"],
      storeFields: ["handle", "title", "featured_image", "first_image", "available"],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.4
      }
    })

    miniSearch.addAll(data.allProducts)

    console.log(data.allProducts);
  })


  let searchResults = [];
  let searchTerm = "";
  $: if(miniSearch && searchTerm) {
    searchResults = miniSearch.search(searchTerm);
  } else searchResults = [];


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


<div class="container mx-auto pt-8 mb-64">

  <input placeholder="Search for products" bind:value={searchTerm} class="input w-64 p-2 pl-4">
  <br>
  {#each searchResults as result (result.id)}
    <a class="block card p-2 m-1" href="/lttstore/products/{result.handle}" animate:flip={{ duration: 200 }} transition:slide>
      <img src={result.featured_image ?? result.first_image} class="inline-block h-8 w-8 rounded-md">
      <span class:line-through={!(result.available ?? true)}>
        {result.title}
      </span>
      <br>
    </a>
  {/each}
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