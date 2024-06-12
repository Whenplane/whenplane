<script lang="ts">
  import type { ShopifyProduct, StockCounts } from "$lib/lttstore/lttstore_types.ts";

  export let product: ShopifyProduct;
  export let stock: StockCounts;
  export let purchasesPerHour: number;
  export let goneIn = false;

  $: goneInHours = stock?.total / purchasesPerHour;
</script>

<a class="card inline-block p-2 m-1 w-48 align-top h-full" href="/lttstore/products/{product.handle}">
  {#if product.featured_image}
    <img src={product.featured_image} class="product-image rounded-xl h-47" alt={product.title}/>
  {:else}
    No featured image
  {/if}
  <div class="inline-block title">
    {product.title}
  </div>
  {#if goneIn && stock && goneInHours < 10}
    <div class="opacity-80">
      Gone in {Math.round(goneInHours)}h
    </div>
  {/if}
</a>

<style>
    .product-image {
        aspect-ratio: 1 / 1;
        object-fit: cover;
        /*border-radius: 12px;*/
    }
    .title {
        min-height: 3em;
    }
</style>