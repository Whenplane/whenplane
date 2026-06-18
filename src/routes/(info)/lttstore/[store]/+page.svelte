<script lang="ts">

  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/state";
  import { getContext, onMount } from "svelte";
  import {flip} from "svelte/animate";
  import {slide, fade} from "svelte/transition";
  import { Progress } from "@skeletonlabs/skeleton-svelte";
  import { invalidateAll } from "$app/navigation";
  import RelativeDate from "$lib/RelativeDate.svelte";

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
</script>
<svelte:head>
  <title>LTTStore Watcher - Whenplane</title>
  <meta name="description" content="The Whenplane LTT Store Watcher watches for changes on LTTStore, and records them. You can also see how much stock they have of an item." />
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb" onclick={reload}>LTT Store Watcher</li>
  {#if loading}
    <li class="crumb" transition:fade|global={{duration: 100}}>
      <Progress width="w-6" stroke={250} value={loading ? undefined : 100}/>
    </li>
  {/if}
</ol>


<div class="container mx-auto pt-8 mb-96 px-2">

  <h1 class="text-center mb-2">LTTStore Watcher</h1>

  <div class="flex justify-between link-header mx-auto">
    <a href="/lttstore/products" class="btn preset-tonal-primary">All Products</a>
    <a href="/lttstore/archive" class="btn preset-tonal-primary">Product Archive</a>
    <a href="/lttstore/collections" class="btn preset-tonal-primary">Collections</a>
  </div>
  <br>
  <br>

  <button class="input w-64 p-1 mx-2 pl-4 text-left inline-block bg-surface-900 text-white/40" onclick={() => openSearch()}>
    Search for products
  </button>
  <a href="/lttstore/advanced-search">Advanced Search</a>
  <br>
  <br>


  {#if data.newProducts.length > 0}
    <h2>New products</h2>
    <div class="opacity-80 pl-2">
      These products are new or returning.
    </div>
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
    <br>
    <br>
  {/if}

  {#if data.popularProducts.length > 0}
    <h2>Popular Products</h2>
    <div class="opacity-80 pl-2">
      From the past few hours
    </div>
    <!-- text-clear is to hide the ellipsis from line-clamp -->
    <div class="overflow-hidden max-md:line-clamp-5 max-lg:line-clamp-3 lg:line-clamp-2 text-clear">
      {#each data.popularProducts as product (product.id)}
        <div class="inline-block text-white text-base" animate:flip={{ duration: 200 }}>
          <LTTProductCard
            product={JSON.parse(product.product)}
            shortTitle={product.shortTitle}
          >
            {#snippet detail()}
              <div class="opacity-80 text-xs">
                {#if product.purchasesPerHour && product.purchasesPerHour > 0}
                  {product.purchasesPerHour.toFixed(2)} sph
                {/if}
              </div>
            {/snippet}
          </LTTProductCard>
        </div>
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
        {#each onSale as product}
          <LTTProductCard product={JSON.parse(product.product)} shortTitle={product.shortTitle} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
        {/each}
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
        {#each lowStock as product}
          <LTTProductCard product={JSON.parse(product.product)} shortTitle={product.shortTitle} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour} available={product.available}/>
        {/each}
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
        <br>
        <br>
      </div>
    {/if}
  {/await}

  <br>
  <br>
  <a href="/lttstore/products" class="btn preset-filled-secondary-500">All products</a><br>
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
