<script lang="ts">
  import { run } from 'svelte/legacy';


  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/state";
  import {flip} from "svelte/animate";
  import { fade } from "svelte/transition"
  import { goto, invalidateAll } from "$app/navigation";
  import { Progress } from "@skeletonlabs/skeleton-svelte";
  import { dev } from "$app/environment";

  let { data } = $props();

  let loading = $state(false);
  async function reload() {
    loading = true;
    await invalidateAll()
    loading = false;
  }

  let sortedBy = $state(page.url.searchParams.get("sort") ?? "metaUpdate");
  if(data.sortColumn === "stockChecked") sortedBy = "updated";
  let first = $state(true);
  run(() => {
    console.debug({sortedBy})
    if(first) {
      first = false;
    } else {
      const newUrl = new URL(location.href);
      newUrl.searchParams.set("sort", sortedBy)

      goto(newUrl.toString(), { noScroll: true } )
      /*history.replaceState({}, document.title, newUrl.toString());
      // first = true;
      reload()*/
    }
  });

</script>

<svelte:head>
  <title>All Products - Whenplane LTTStore Watcher</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Watcher</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb" onclick={reload}>Products</li>
  {#if loading}
    <li class="crumb" transition:fade|global={{duration: 100}}>
      <Progress width="w-6" stroke={250} value={loading ? undefined : 100}/>
    </li>
  {/if}
</ol>

<div class="container mx-auto pt-8 mb-64">
  <h1>All Products</h1>
  <div class="opacity-80 pl-2">
    Sorted by
    <select bind:value={sortedBy} class="select w-56 py-1">
<!--      <option value="purchasesPerDay">average sales per day</option>-->
<!--      <option value="purchasesPerHour">average sales per hour</option>-->
      <option value="metaUpdate">metadata updated</option>
      <option value="stockUpdate">stock updated</option>
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
{#if dev}
  <pre>{JSON.stringify(data, undefined, '\t')}</pre>
{/if}