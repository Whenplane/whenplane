<script lang="ts">
  import type { ShopifyProduct, StockCounts } from "$lib/lttstore/lttstore_types.ts";
  import Price from "$lib/lttstore/Price.svelte";
  import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";
  import { productRedirects } from "$lib/lttstore/product_redirects.ts";


  interface Props {
    product: ShopifyProduct;
    stock?: StockCounts | undefined;
    purchasesPerHour?: number | undefined;
    goneIn?: boolean;
    available?: boolean;
    lazyLoadImage?: boolean;
  }

  let {
    product,
    stock = undefined,
    purchasesPerHour = undefined,
    goneIn = false,
    available = true,
    lazyLoadImage = false
  }: Props = $props();

  let goneInHours = $derived((stock?.total ?? -1) / (purchasesPerHour ?? -1));

  let handle = $derived(productRedirects[product.handle] ?? product.handle);
</script>

<a class="card inline-block p-2 m-1 w-48 align-top h-full" href="/lttstore/products/{handle}" class:opacity-50={!available}>
  {#if product.featured_image}
    {#if lazyLoadImage}
      <LargerLazyLoad>
        <img src={product.featured_image} class="product-image rounded-xl h-47" alt={product.title}/>
      </LargerLazyLoad>
    {:else}
      <img src={product.featured_image} class="product-image rounded-xl h-47" alt={product.title} loading="lazy"/>
    {/if}
  {:else}
    No featured image
  {/if}
  <div class="inline-block title" class:line-through={!available}>
    {product.title}
  </div>
  {#if product.price}
    <br>
    {#if !product.compare_at_price || product.price === product.compare_at_price}
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

    a {
        text-wrap: initial;
    }

</style>