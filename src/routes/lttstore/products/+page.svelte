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

  let sortedBy = $page.url.searchParams.get("sort") ?? "purchasesPerDay";
  if(data.sortColumn === "stockChecked") sortedBy = "updated";
  let first = true;
  $: {
    console.debug({sortedBy})
    if(first) {
      first = false;
    } else {
      const newUrl = new URL(location.href);
      newUrl.searchParams.set("sort", sortedBy)

      history.replaceState({}, document.title, newUrl.toString());
      // first = true;
      reload()
    }
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
    <li class="crumb" transition:fade|global={{duration: 100}}>
      <ProgressRadial width="w-6" stroke={250} value={loading ? undefined : 100}/>
    </li>
  {/if}
</ol>

<div class="container mx-auto pt-8 mb-64">
  <h1>All Products</h1>
  <div class="opacity-80 pl-2">
    Sorted by
    <select bind:value={sortedBy} class="select w-56 py-1">
      <option value="purchasesPerDay">average sales per day</option>
      <option value="purchasesPerHour">average sales per hour</option>
      <option value="updated">recently updated</option>
      <option value="restocked">recently restocked</option>
    </select>
  </div>
  {#each data.allProducts as product, i (product.id)}
    <div class="inline-block" animate:flip={{ duration: 200 }}>
      <LTTProductCard product={JSON.parse(product.product)} available={product.available} lazyLoadImage={i > 30}/>
    </div>
  {:else}
    No products are being tracked yet!
  {/each}
</div>