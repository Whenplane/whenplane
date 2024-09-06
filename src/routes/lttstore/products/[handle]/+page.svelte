<script lang="ts">
  import type { ShopifyProduct, StockCounts } from "$lib/lttstore/lttstore_types.ts";
  import { page } from "$app/stores";
  import ProductStockHistoryGraph from "$lib/lttstore/product/ProductStockHistoryGraph.svelte";
  import DateStamp from "$lib/DateStamp.svelte";
  import { commas } from "$lib/utils.ts";
  import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news.js";
  import { goto } from "$app/navigation";
  import Price from "$lib/lttstore/Price.svelte";
  import { browser } from "$app/environment";
  import ProductUpdateRequestButton from "$lib/lttstore/product/ProductUpdateRequestButton.svelte";

  export let data;

  let chartUpdateNumber = 1;

  $: productInfo = JSON.parse(data.product.product as string) as ShopifyProduct
  $: currentStock = JSON.parse(data.product.stock as string) as StockCounts

  $: nonZeroPurchasesPerHour = (data.product?.purchasesPerHour === 0 ? (data.product.purchasesPerDay / 24) : data.product.purchasesPerHour);
  $: goneInHours = ((currentStock.total ?? -1) / nonZeroPurchasesPerHour) - ((Date.now() - data.product.stockChecked) / (60 * 60e3));

  $: strippedTitle = productInfo.title.replace(/\(.*\)/g, "").replace("Knife", "Knive").trim();

  let historyDays = $page.url.searchParams.get("historyDays") ?? "7";
  let first = true;
  $: {
    console.debug({historyDays})
    if(first) {
      first = false;
    } else {
      const newUrl = new URL(location.href);
      newUrl.searchParams.set("historyDays", historyDays)

      first = true;
      goto(newUrl.toString(), { noScroll: true } ).then(() => {
        chartUpdateNumber++;
      })

      /*history.pushState({}, document.title, newUrl.toString());
      first = true;
      invalidateAll().then(() => {
        chartUpdateNumber++;
      });*/
    }
  }
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Tracker</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/products">Products</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{productInfo.title}</li>
</ol>

<svelte:head>
  <title>{data.product.title} - Whenplane LTTStore Watcher</title>
</svelte:head>

<div class="container mx-auto p-2 pt-8 mb-64">

  <h1 class:line-through={!data.product.available}>{productInfo.title}</h1>
  {#if productInfo.featured_image}
    <img src={productInfo.featured_image} class="product-image" alt={productInfo.title}/>
  {:else}
    No featured image
  {/if}
  {#if !productInfo.compare_at_price && typeof productInfo.price === "number"}
    <Price usd={productInfo.price/100}/>
  {:else if typeof productInfo.price === "number" && productInfo.compare_at_price}
    <span class="old-price">
      <Price usd={productInfo.compare_at_price/100}/>
    </span>
    <Price usd={productInfo.price/100}/>
  {/if}
  <br>
  <br>
  {#if typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock.total ?? -1) < 0)}
    Average of {Math.round(data.product?.purchasesPerHour * 100)/100} sold per hour recently.<br>
  {/if}
  {#if typeof data.product?.purchasesPerDay === "number" && data.product?.purchasesPerDay >= 0 && !(data.product?.purchasesPerDay === 0 && (currentStock.total ?? -1) < 0)}
    Average of {Math.round(data.product?.purchasesPerDay * 100)/100} sold per day.<br>
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

  {#if productInfo.description}
    <div class="max-w-xl my-4">
      <Accordion class="mx-4" spacing="" regionPanel="">
        <AccordionItem>
          <svelte:fragment slot="summary">Item Description</svelte:fragment>
          <svelte:fragment slot="content">
            <div class="item-description">
              {@html sanitizeHtml(productInfo.description, newsSanitizeSettings)}
            </div>
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
    </div>
  {/if}

  <br>
  <br>
  <br>
  <h2>Stock</h2>

  {#if (currentStock.total ?? -1) >= 0}
    {#if data.product.available}
      Currently there is
    {:else}
      Before this product was removed, there was
    {/if}
    {#if (currentStock.total ?? -1) > 500000}
      a total of {commas(currentStock.total)}
    {:else}
      more than 500,000
    {/if}

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

  <h2>Stock History</h2>
  We check the stock of products occasionally. Here is the history of those stock numbers.
  <!-- stock started being recorded on 1718147742676 -->
  <select class="select inline-block w-48" bind:value={historyDays}>
    <option value="1">24 hours</option>
    <option value="7">7 days</option>
    <option value="30">30 days</option>
    {#if Date.now() > 1720739742676}
      <option value="90">3 months (90 days)</option>
    {/if}
    {#if Date.now() > 1725923742676}
      <option value="180">6 months (180 days)</option>
    {/if}
    {#if Date.now() > 1733699742676}
      <option value="365">1 year (365 days)</option>
    {/if}
  </select>
  <ProductStockHistoryGraph stockHistory={data.stockHistory} productName={productInfo.title} {chartUpdateNumber}/>
  <br>
  Note that stock started being recorded on June 11th, 2024, so data before that is not available.
  <br>
  <br>
  <br>
  <h2>Time remaining until out of stock</h2>
  {#if goneInHours > 0 && (currentStock.total ?? -1) > 0 && typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock.total ?? -1) < 0)}
    If this product keeps selling at {Math.round(nonZeroPurchasesPerHour * 100)/100} units per hour, it could be gone in
    {#if goneInHours < 48}
      {#if goneInHours <= 1}
        less than an hour
      {:else}
        {goneInHours.toFixed(2)} hours
      {/if}
    {:else}
      {(goneInHours / 24).toFixed(2)} days
    {/if}
  {/if}
  <br>
  <br>
  <br>
  <br>
  <h2>Request update</h2>
  If you want more up-to-date data for this product, you can request an update below.<br>
  To prevent abuse, you can only request updates once an hour per product, and 30 minutes between a request for any product.<br>
  <br>
  If your request is successful, it usually takes between 30 seconds and 5 minutes for the data to appear on this page. You will need to reload.<br>
  <br>

  <ProductUpdateRequestButton/>

  <!--{#if dev}
    <br>
    <br>
    <pre>{JSON.stringify(productInfo, undefined, '\t')}</pre>
    <pre>{JSON.stringify({
      ...data.product,
      product: "shown above"
    }, undefined, '\t')}</pre>
  {/if}-->
</div>

<style>
  .product-image {
      height: 12em;
      max-width: 90vw;
      object-fit: contain;
      border-radius: 12px;
  }

  .old-price {
      opacity: 70%;
      text-decoration: line-through;
  }

  .item-description :global(p) {
      margin-bottom: 1em;
  }
</style>