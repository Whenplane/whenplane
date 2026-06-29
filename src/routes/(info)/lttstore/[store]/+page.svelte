<script lang="ts">

  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/state";
  import { getContext, onMount } from "svelte";
  import {flip} from "svelte/animate";
  import {slide, fade} from "svelte/transition";
  import { Progress } from "@skeletonlabs/skeleton-svelte";
  import { invalidateAll } from "$app/navigation";
  import RelativeDate from "$lib/RelativeDate.svelte";
  import { Store } from "$lib/lttstore/lttstore_types.ts";

  let { data } = $props();

  let loading = $state(false);
  async function reload() {
    loading = true;
    await invalidateAll()
    loading = false;
  }

  let mounted = $state(false);
  onMount(() => {
    setTimeout(() => mounted = true, 0)
  });

  const openSearch = getContext<() => void>("lttstore-search-modal");

  const description = "The Whenplane LTT Store Watcher watches for changes on LTTStore, and records them. When products are removed from LTTStore, Whenplane provides an archive of them. You can also see how much stock they have of an item.";
</script>
<svelte:head>
  <title>LTTStore Watcher ({data.store.storeName}) - Whenplane</title>
  <meta name="description" content={description}>
  <meta property="og:type" content="website">
  <meta property="og:title" content="LTTStore Watcher ({data.store.storeName})">
  <meta property="og:description" content={description}>
  <meta property="og:site_name" content="Whenplane LTTStore Watcher ({data.store.storeName})">
  <meta property="og:url" content="https://whenplane.com/lttstore/{data.store.storeName.toLowerCase()}">
  <meta property="og:locale" content="en_US">
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb" onclick={reload}>LTT Store Watcher ({data.store.storeName})</li>
  {#if loading}
    <li class="crumb" transition:fade|global={{duration: 100}}>
      <Progress width="w-6" stroke={250} value={loading ? undefined : 100}/>
    </li>
  {/if}
</ol>


<div class="container mx-auto pt-8 mb-96 px-2">

  <h1 class="text-center mb-2">{data.store.storeName} LTTStore Watcher</h1>

  <div class="flex flex-wrap md:justify-between max-md:justify-around link-header mx-auto max-w-dvw *:my-0.5">
    <a href="/lttstore/{page.params.store}/products" class="btn preset-tonal-primary">All Products</a>
    <a href="/lttstore/{page.params.store}/archive" class="btn preset-tonal-primary">Product Archive</a>
    <a href="/lttstore/{page.params.store}/collections" class="btn preset-tonal-primary">Collections</a>
    {#if data.store.id === Store.US}
      <a href="/lttstore/global" class="btn preset-tonal-primary">Global Store Watcher</a>
    {:else}
      <a href="/lttstore/us" class="btn preset-tonal-primary">US Store Watcher</a>
    {/if}
  </div>
  <br>
  <br>

  <button class="input w-64 p-1 mx-2 pl-4 text-left inline-block bg-surface-900 text-white/40" onclick={() => openSearch()}>
    Search for products
  </button>
  <a href="/lttstore/{page.params.store}/advanced-search">Advanced Search</a>
  <br>
  <br>


  {#if data.newProducts.length > 0}
    <h2>New products</h2>
    <div class="opacity-80 pl-2">
      These products are new or returning.
    </div>
    <div class="flex flex-wrap">
      {#each data.newProducts as product}
        {@const productData = JSON.parse(product.product)}
        <LTTProductCard
          product={productData}
          shortTitle={product.shortTitle}
          goneIn={true}
          stock={JSON.parse(product.stock)}
          purchasesPerHour={product.purchasesPerHour}
          available={product.available}
        >
          {#snippet detail()}
            {@const publishedTime = new Date(productData.published_at).getTime()}
            <div class="opacity-80 text-xs">
              {#if product.firstSeen < publishedTime}
                Re-Published
              {:else}
                Published
              {/if}
              <RelativeDate epochSeconds={publishedTime / 1e3} />
            </div>
          {/snippet}
        </LTTProductCard>
      {/each}
    </div>
    <br>
    <br>
  {/if}

  {#if data.popularProducts.length > 0}
    <h2>Popular Products</h2>
    <div class="opacity-80 pl-2">
      From the past few hours
    </div>
    <!-- text-clear is to hide the ellipsis from line-clamp -->
    <div class={[
      "grid auto-rows-[0] grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*48),max-content))]",
      "lg:grid-rows-[repeat(2,auto)] max-lg:grid-rows-[repeat(3,auto)] max-md:grid-rows-[repeat(5,auto)]",
      "overflow-hidden text-clear"
    ]}>
      {#each data.popularProducts as product (product.id)}
        <LTTProductCard
          product={JSON.parse(product.product)}
          shortTitle={product.shortTitle}
          classes="text-white! text-base!"
          style="color: var(--base-font-color-dark)"
        >
          {#snippet detail()}
            <div class="opacity-80 text-xs">
              {#if product.purchasesPerHour && product.purchasesPerHour > 0}
                {product.purchasesPerHour.toFixed(2)} sph
              {/if}
            </div>
          {/snippet}
        </LTTProductCard>
      {:else}
        No products are being tracked yet!
      {/each}
    </div>
    <br>
    <br>
  {/if}

  {#await data.onSale}
    <div class="height-0 width-0"></div>
  {:then onSale}
    {#if onSale.length > 0 && mounted}
      <div in:slide>
        <h2>On Sale</h2>
        <div class="opacity-80 pl-2">
          These products are currently on sale. (excludes items that are out of stock)
        </div>
        <div class="flex flex-wrap">
          {#each onSale as product}
            <LTTProductCard product={JSON.parse(product.product)} shortTitle={product.shortTitle} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
          {/each}
        </div>
        <br>
        <br>
      </div>
    {/if}
  {/await}

  {#await data.lowStock}
    <div class="height-0 width-0"></div>
  {:then lowStock}
    {#if lowStock.length > 0 && mounted}
      <div in:slide>
        <h2>Low Stock</h2>
        <div class="opacity-80 pl-2">
          These items are low in stock and selling fast enough to possibly run out of stock soon.
        </div>
        <div class="flex flex-wrap">
          {#each lowStock as product}
            <LTTProductCard product={JSON.parse(product.product)} shortTitle={product.shortTitle} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
          {/each}
        </div>
        <br>
        <br>
      </div>
    {/if}
  {/await}

  {#await data.recentRestocks}
    <div class="height-0 width-0"></div>
  {:then recentRestocks}
    {#if recentRestocks.length > 0 && mounted}
      <div in:slide>
        <h2>Recently Re-stocked</h2>
        <div class="opacity-80 pl-2">
          These items have been restocked in the past 6 days.
        </div>
        <div class="flex flex-wrap">
          {#each recentRestocks as product}
            <LTTProductCard
              product={JSON.parse(product.product)}
              shortTitle={product.shortTitle}
              purchasesPerHour={product.purchasesPerHour}
              available={product.available}
            >
              {#snippet detail()}
                <div class="opacity-80 text-xs">
                  Restocked <RelativeDate epochSeconds={product.lastRestock / 1e3} />
                </div>
              {/snippet}
            </LTTProductCard>
          {/each}
        </div>
        <br>
        <br>
      </div>
    {/if}
  {/await}

  <br>
  <br>
  <a href="/lttstore/{page.params.store}/products" class="btn preset-filled-secondary-500">All products</a><br>
  <br>
  <br>
  Join the <a data-sveltekit-reload href="/discord">discord</a> where there is a channel that can alert you to useful info! (e.g. new products, sales, restocks)
</div>

<style>
  .result-highlight > :global(mark) {
      /*background-color: rgb(var(--color-primary-500) / 0.4);*/
      background-color: inherit;
      color: inherit;
      font-weight: bold;
  }

  .link-header {
      max-width: 50rem;
  }
  .link-header > a {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }

  .text-clear {
      color: rgba(0, 0, 0, 0);
      font-size: 0;
  }
</style>
