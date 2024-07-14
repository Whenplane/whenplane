<script lang="ts">

  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/stores";
  import {flip} from "svelte/animate";
  import { fade } from "svelte/transition"
  import { invalidateAll } from "$app/navigation";
  import {ProgressRadial} from "@skeletonlabs/skeleton";

  export let data;

  let loading = false;
  async function reload() {
    loading = true;
    await invalidateAll()
    loading = false;
  }
</script>

<svelte:head>
  <title>All Products - Whenplane LTTStore Watcher</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Tracker</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb" on:click={reload}>Products</li>
  {#if loading}
    <li class="crumb" transition:fade={{duration: 100}}>
      <ProgressRadial width="w-6" stroke={250} value={loading ? undefined : 100}/>
    </li>
  {/if}
</ol>

<div class="container mx-auto pt-8 mb-64">
  <h1>All Products</h1>
  <div class="opacity-80 pl-2">
    Sorted by average sales per hour.
  </div>
  {#each data.allProducts as product, i (product.id)}
    <div class="inline-block" animate:flip={{ duration: 200 }}>
      <LTTProductCard product={JSON.parse(product.product)} available={product.available} lazyLoadImage={i > 30}/>
    </div>
  {:else}
    No products are being tracked yet!
  {/each}
</div>