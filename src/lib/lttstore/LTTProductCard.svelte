<script lang="ts">
  import type { ShopifyProduct, StockCounts } from "$lib/lttstore/lttstore_types.ts";
  import Price from "$lib/lttstore/Price.svelte";
  import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";

  export let product: ShopifyProduct;
  export let stock: StockCounts | undefined = undefined;
  export let purchasesPerHour: number | undefined = undefined;
  export let goneIn = false;
  export let available = true;

  export let lazyLoadImage = false;

  $: goneInHours = (stock?.total ?? -1) / (purchasesPerHour ?? -1);
</script>

<a class="card inline-block p-2 m-1 w-48 align-top h-full" href="/lttstore/products/{product.handle}" class:opacity-50={!available}>
  {#if product.featured_image}
    {#if lazyLoadImage}
      <LargerLazyLoad>
        <img src={product.featured_image} class="product-image rounded-xl h-47" alt={product.title}/>
      </LargerLazyLoad>
    {:else}
      <img src={product.featured_image} class="product-image rounded-xl h-47" alt={product.title}/>
    {/if}
  {:else}
    No featured image
  {/if}
  <div class="inline-block title" class:line-through={!available}>
    {product.title}
  </div>
  {#if product.price}
    <br>
    {#if !product.compare_at_price}
      <Price usd={product.price/100}/>
    {:else}
        <span class="old-price">
          <Price usd={product.compare_at_price/100}/>
        </span>
      <Price usd={product.price/100}/>
    {/if}
  {/if}
  {#if goneIn && stock && goneInHours < 10 && goneInHours >= 0}
    <div class="opacity-80">
      Could be gone in {Math.round(goneInHours)}h
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

    .old-price {
        opacity: 70%;
        text-decoration: line-through;
    }

</style>