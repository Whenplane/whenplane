<script lang="ts">
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/state";
  import {flip} from "svelte/animate";
  import { fade } from "svelte/transition"
  import { goto, invalidateAll } from "$app/navigation";
  import { Progress } from "@skeletonlabs/skeleton-svelte";
  import { dev } from "$app/environment";
  import type { PageProps } from "./$types";
  import DateStamp from "$lib/DateStamp.svelte";

  let { data }: PageProps = $props();

  let loading = $state(false);
  async function reload() {
    loading = true;
    await invalidateAll()
    loading = false;
  }

  let sortedBy = $state(page.url.searchParams.get("sort") ?? "purchasesPerDay");
  let first = !page.url.searchParams.has("sort");
  $effect(() => {
    sortedBy;
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
  })

</script>

<svelte:head>
  <title>All Products - Whenplane LTTStore Watcher</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/{page.params.store}">LTT Store Watcher ({data.store.storeName})</a></li>
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
    <select bind:value={sortedBy} class="select w-56 py-1 inline-block px-2 bg-surface-900">
      <option value="purchasesPerDay">average sales per day</option>
      <option value="purchasesPerHour">average sales per hour</option>
      <option value="metaUpdate">metadata updated</option>
      <option value="stockUpdate">stock updated</option>
      <option value="restocked">recently restocked</option>
    </select>
  </div>
  <div class="flex flex-wrap">
    {#each data.allProducts as product, i (product.id)}
      <div class="inline-flex" animate:flip={{ duration: 200 }}>
        <LTTProductCard
          product={JSON.parse(product.product)}
          shortTitle={product.shortTitle}
          available={product.available}
          lazyLoadImage={i > 10}
        >
          {#snippet detail()}
            <div class="opacity-80 text-xs">
              {#if data.sortColumn === "purchasesPerDay"}
                {#if product.purchasesPerDay !== -1}
                  {product.purchasesPerDay?.toFixed(2) ?? "??"}
                {:else}
                  ??
                {/if}
                spd
              {:else if data.sortColumn === "purchasesPerHour"}
                {#if product.purchasesPerHour !== -1}
                  {product.purchasesPerHour?.toFixed(2) ?? "??"}
                {:else}
                  ??
                {/if}
                sph
              {:else if data.sortColumn === "metadataUpdate"}
                Meta updated
                {#if product.metadataUpdate && product.metadataUpdate > 0}
                  <DateStamp epochSeconds={product.metadataUpdate / 1e3} />
                {:else}
                  N/A
                {/if}
              {:else if data.sortColumn === "stockChecked"}
                Stock checked
                {#if product.stockChecked && product.stockChecked > 0}
                  <DateStamp epochSeconds={product.stockChecked / 1e3} />
                {:else}
                  N/A
                {/if}
              {:else if data.sortColumn === "lastRestock"}
                Restocked
                {#if product.lastRestock && product.lastRestock > 0}
                  <DateStamp epochSeconds={product.lastRestock / 1e3} />
                {:else}
                  N/A
                {/if}
              {/if}
            </div>
          {/snippet}
        </LTTProductCard>
      </div>
    {:else}
      No products are being tracked yet!
    {/each}
  </div>
</div>
{#if dev}
  <pre>{JSON.stringify(data, undefined, '\t')}</pre>
{/if}