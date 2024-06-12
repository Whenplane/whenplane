<script lang="ts">
  import type { ShopifyProduct } from "$lib/lttstore/lttstore_types.ts";
  import { page } from "$app/stores";
  import { dev } from "$app/environment";

  export let data;

  $: productInfo = JSON.parse(data.product.product as string) as ShopifyProduct
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Tracker</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Products</li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{productInfo.title}</li>
</ol>

<div class="container mx-auto pt-8">

  <h1>{productInfo.title}</h1>
  {#if productInfo.featured_image}
    <img src={productInfo.featured_image} class="product-image" alt={productInfo.title}/>
  {:else}
    No featured image
  {/if}
  <br>
  <br>
  {#if typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0}
    Average of {Math.round(data.product?.purchasesPerHour * 100)/100} sold per hour recently.
  {/if}
  <br>
  <br>
  <a href="https://lttstore.com/products/{data.product?.handle}">
    View or Buy on lttstore.com
  </a>

  {#if dev}
    <br>
    <br>
    <pre>{JSON.stringify(productInfo, undefined, '\t')}</pre>
    <pre>{JSON.stringify({
      ...data.product,
      product: "shown above"
    }, undefined, '\t')}</pre>
  {/if}
</div>

<style>
  .product-image {
      max-width: 12em;
      border-radius: 12px;
  }
</style>