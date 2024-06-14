<script lang="ts">
  import type { ShopifyProduct, StockCounts } from "$lib/lttstore/lttstore_types.ts";
  import { page } from "$app/stores";
  import { dev } from "$app/environment";
  import ProductStockHistoryGraph from "$lib/lttstore/product/ProductStockHistoryGraph.svelte";
  import DateStamp from "$lib/DateStamp.svelte";
  import { commas } from "$lib/utils.ts";

  export let data;

  $: productInfo = JSON.parse(data.product.product as string) as ShopifyProduct
  $: currentStock = JSON.parse(data.product.stock as string) as StockCounts

  $: strippedTitle = productInfo.title.replace(/\(.*\)/g, "").replace("Knife", "Knive").trim()
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Tracker</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">Products</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{productInfo.title}</li>
</ol>

<svelte:head>
  <title>{data.product.title} - Whenplane LTTStore Watcher</title>
</svelte:head>

<div class="container mx-auto pt-8 mb-64">

  <h1 class:line-through={!data.product.available}>{productInfo.title}</h1>
  {#if productInfo.featured_image}
    <img src={productInfo.featured_image} class="product-image" alt={productInfo.title}/>
  {:else}
    No featured image
  {/if}
  {#if !productInfo.compare_at_price && typeof productInfo.price === "number"}
    ${productInfo.price/100}
  {:else if typeof productInfo.price === "number" && productInfo.compare_at_price}
        <span class="old-price">
          ${productInfo.compare_at_price/100}
        </span>
    ${productInfo.price/100}
  {/if}
  <br>
  <br>
  {#if typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock.total ?? -1) < 0)}
    Average of {Math.round(data.product?.purchasesPerHour * 100)/100} sold per hour recently.
  {/if}
  <br>
  <br>
  <a href="https://lttstore.com/products/{data.product?.handle}" class:!line-through={!data.product.available}>
    View or Buy on lttstore.com
  </a>
  {#if !data.product.available}
    <br>
    This product appears to no longer be on lttstore.com.<br>
    Usually this happens when a product is retired and will not be coming back.
  {/if}

  <br>
  <br>
  <br>

  {#if (currentStock.total ?? -1) >= 0}
    {#if data.product.available}
      Currently there is
    {:else}
      Before this product was removed, there was
    {/if}
    a total of {commas(currentStock.total)}
    {strippedTitle}{currentStock.total === 1 || strippedTitle.endsWith("s") ? "" : "s"}
    in stock.
    <br>
    {#if data.product.stockChecked !== -1}
      <small class="opacity-80">
        Last checked <DateStamp epochSeconds={data.product.stockChecked / 1e3}/>
      </small>
    {/if}
  {/if}
  <br>
  <br>

  <h1>Stock History</h1>
  We check the stock of products occasionally. Here is the history of those stock numbers (the latest 50 datapoints are shown)
  <ProductStockHistoryGraph stockHistory={data.stockHistory} productName={productInfo.title}/>

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

  .old-price {
      opacity: 70%;
      text-decoration: line-through;
  }
</style>