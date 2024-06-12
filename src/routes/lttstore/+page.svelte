<script lang="ts">
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/stores";

  export let data;
</script>
<svelte:head>
  <title>LTTStore Watcher - Whenplane</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">LTT Store Tracker</li>
</ol>


<div class="container mx-auto pt-8">
  <h1>Popular Products</h1>
  <div class="opacity-80 pl-2">
    From the past few hours
  </div>
  {#each data.popularProducts as product}
    <LTTProductCard product={JSON.parse(product.product)}/>
  {:else}
    No products are being tracked yet!
  {/each}
  <br>
  <br>
  {#if data.lowStock.length > 0}
    <h1>Low Stock</h1>
    <div class="opacity-80 pl-2">
      Could be gone soon!
    </div>
    {#each data.lowStock as product}
      <LTTProductCard product={JSON.parse(product.product)} goneIn={true} stock={JSON.parse(product.stock)} purchasesPerHour={product.purchasesPerHour}/>
    {/each}
  {/if}
</div>