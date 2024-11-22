<script lang="ts">
  import type {
    BackorderAlerts,
    ProductDetailModule,
    ShopifyProduct,
    StockCounts
  } from "$lib/lttstore/lttstore_types.ts";
  import { page } from "$app/stores";
  import ProductStockHistoryGraph from "$lib/lttstore/product/ProductStockHistoryGraph.svelte";
  import DateStamp from "$lib/DateStamp.svelte";
  import { commas, truncateText } from "$lib/utils.ts";
  import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news";
  import { goto } from "$app/navigation";
  import Price from "$lib/lttstore/Price.svelte";
  import { browser, dev } from "$app/environment";
  import ProductUpdateRequestButton from "$lib/lttstore/product/ProductUpdateRequestButton.svelte";
  import ExclamationTriangle from "svelte-bootstrap-icons/lib/ExclamationTriangle.svelte";
  import { getFieldName } from "$lib/lttstore/field_names.ts";
  import { getDiffComponent } from "$lib/lttstore/field_components.ts";

  export let data;

  let chartUpdateNumber = 1;

  $: productInfo = JSON.parse(data.product.product as string) as ShopifyProduct
  $: currentStock = JSON.parse(data.product.stock as string) as StockCounts
  $: productDetailModules = JSON.parse(data.product.productDetailModules) as ProductDetailModule[];

  $: nonZeroPurchasesPerHour = (data.product?.purchasesPerHour === 0 ? (data.product.purchasesPerDay / 24) : data.product.purchasesPerHour);
  $: goneInHours = ((currentStock.total ?? -1) / nonZeroPurchasesPerHour) - ((Date.now() - data.product.stockChecked) / (60 * 60e3));

  $: strippedTitle = productInfo.title.replace(/\(.*\)/g, "").replace("Knife", "Knive").trim();

  let backorderNotices = new Set();
  $: {
    backorderNotices.clear();
    let backorderAlerts = JSON.parse(data.product?.backorderAlerts) as BackorderAlerts;
    if(backorderAlerts) {
      Object.values(backorderAlerts).forEach(alert => {
        if(alert && alert.trim()) {
          backorderNotices.add(alert)
        }
      });
      backorderNotices = backorderNotices;
    }
  }


  let historyDays = data.historyDays+"";
  let first = true;
  $: {
    console.debug({historyDays})
    if(first) {
      first = false;
    } else {
      const newUrl = new URL(location.href);
      newUrl.searchParams.set("historyDays", historyDays+"")

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
  <meta name="description" content={truncateText(sanitizeHtml(productInfo.description ?? "", {allowedTags: []}), 200)}>
  {#if productInfo.featured_image}
    <meta property="og:image" content={productInfo.featured_image}>
  {/if}
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
  {#if typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock.total ?? -1) < 0) && (currentStock.total ?? -1) !== 500000}
    Average of {Math.round(data.product?.purchasesPerHour * 100)/100} sold per hour recently.<br>
  {/if}
  {#if typeof data.product?.purchasesPerDay === "number" && data.product?.purchasesPerDay >= 0 && !(data.product?.purchasesPerDay === 0 && (currentStock.total ?? -1) < 0) && (currentStock.total ?? -1) !== 500000}
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
  {#if data.product.productDetailModules}
    {#each productDetailModules as detailModule}
      <div class="max-w-xl my-4">
        <Accordion class="mx-4" spacing="" regionPanel="">
          <AccordionItem>
            <svelte:fragment slot="summary">{detailModule.title}</svelte:fragment>
            <svelte:fragment slot="content">
              <div class="item-description">
                {@html sanitizeHtml(detailModule.content, newsSanitizeSettings)}
              </div>
            </svelte:fragment>
          </AccordionItem>
        </Accordion>
      </div>
    {/each}
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
    {#if (currentStock.total ?? -1) <= 500000}
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

  {#if backorderNotices.size > 0}
    <h2>Backorder Notice</h2>
    {#each backorderNotices as backorderNotice}
      <aside class="alert variant-ghost">
        <!-- Icon -->
        <div><ExclamationTriangle width="2em" height="2em"/></div>
        <!-- Message -->
        <div class="alert-message">
<!--          <h4 class="h4">(title)</h4>-->
          <p>{backorderNotice}</p>
        </div>
      </aside>
      <br>
    {/each}
    <br>
    <br>
  {/if}

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
    <option value="all">all-time</option>
  </select>
  <ProductStockHistoryGraph stockHistory={data.stockHistory} productName={productInfo.title} {chartUpdateNumber}/>
  <br>
  {#if data.product.firstSeen < 1719248750000}
    Note that stock started being recorded on June 11th, 2024, so data before that is not available.
  {/if}
  <br>
  <br>
  <br>
  {#if goneInHours > 0 && (currentStock.total ?? -1) > 0 && (currentStock.total ?? -1) <= 500000 && typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock.total ?? -1) < 0)}
    <h2>Time remaining until out of stock</h2>
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
    <br>
    <br>
    <br>
    <br>
  {/if}
  <h2 id="change-history">Change history</h2>
  {#await data.changeHistory}

  {:then changeHistory}
    <div class="table-container rounded-md">
      <table class="table table-hover rounded-md">
        <thead>
        <tr>
          <th>What changed</th>
          <td>Change seen</td>
          <th>Before</th>
          <th>After</th>
        </tr>
        </thead>
        <tbody>
        {#each changeHistory as change}
          <tr>
            <td>{getFieldName(change.field)}</td>
            <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
            <td><svelte:component this={getDiffComponent(change.field)} before={change.old} after={change.new} displaying="before"/></td>
            <td><svelte:component this={getDiffComponent(change.field)} before={change.old} after={change.new} displaying="after"/></td>
          </tr>
        {/each}
        </tbody>
        {#if data.product.firstSeen < 1727147700624}
          <tfoot>
          <tr style="text-transform: initial !important;">
            <td class="!p-2 opacity-70" colspan="3">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
          </tr>
          </tfoot>
        {/if}
      </table>
    </div>
  {/await}
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

  {#if dev}
    <br>
    <br>
    <pre>{JSON.stringify({
      ...data,
      product: "shown below"
    }, undefined, '\t')}</pre>
    <pre>{JSON.stringify({
      ...data.product,
      product: "shown below"
    }, undefined, '\t')}</pre>
    <pre>{JSON.stringify(productInfo, undefined, '\t')}</pre>
  {/if}
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
  .item-description :global(ul) {
      list-style: initial;
      padding-left: 1.5em;
      margin-bottom: 1em;
  }
  .item-description :global(ol) {
      list-style: decimal;
      padding-left: 1.5em;
      margin-bottom: 1em;
  }
</style>