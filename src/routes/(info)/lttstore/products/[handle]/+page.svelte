<script lang="ts">
  import { run } from 'svelte/legacy';

  import type {
    BackorderAlerts,
    ProductDetailModule,
    ShopifyProduct,
    StockCounts
  } from "$lib/lttstore/lttstore_types.ts";
  import { page } from "$app/state";
  import ProductStockHistoryGraph from "$lib/lttstore/product/ProductStockHistoryGraph.svelte";
  import DateStamp from "$lib/DateStamp.svelte";
  import { commas, truncateText } from "$lib/utils.ts";
  import { Accordion } from "@skeletonlabs/skeleton-svelte";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news";
  import { goto } from "$app/navigation";
  import Price from "$lib/lttstore/Price.svelte";
  import { browser, dev } from "$app/environment";
  import ProductUpdateRequestButton from "$lib/lttstore/product/ProductUpdateRequestButton.svelte";
  import ExclamationTriangle from "svelte-bootstrap-icons/lib/ExclamationTriangle.svelte";
  import Tags from "svelte-bootstrap-icons/lib/Tags.svelte";
  import { getFieldName } from "$lib/lttstore/field_names.ts";
  import { getDiffComponent } from "$lib/lttstore/field_components.ts";
  import ProductMoveRateGraph from "$lib/lttstore/product/ProductMoveRateGraph.svelte";
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import ToolTip from "$lib/ToolTip.svelte";

  let { data } = $props();

  let chartUpdateNumber = $state(1);

  let productInfo = $derived(JSON.parse(data.product.product as string) as ShopifyProduct)
  let currentStock = $derived(JSON.parse(data.product.stock as string) as StockCounts)
  let productDetailModules = $derived(JSON.parse(data.product.productDetailModules) as ProductDetailModule[]);

  let nonZeroPurchasesPerHour = ($derived(data.product?.purchasesPerHour === 0 ? (data.product.purchasesPerDay / 24) : data.product.purchasesPerHour));
  let goneInHours = $derived(((currentStock?.total ?? -1) / nonZeroPurchasesPerHour) - ((Date.now() - data.product.stockChecked) / (60 * 60e3)));

  let variantsGoneIn = $derived(Object.keys(Object.keys(data.stockHistory).length >= 1 ? JSON.parse(data.stockHistory[0]?.stock ?? "{}") : {})
    .filter(n => n !== "total") // we already do total above, we dont need to do it again
    .map(k => {
      let previous = data.stockHistory[data.stockHistory.length - 2];
      const latest = data.stockHistory[data.stockHistory.length - 1];

      if(!previous || !latest) return undefined;

      let previousStock = JSON.parse(previous.stock)[k];
      const currentStock = JSON.parse(latest.stock)[k];

      let i = data.stockHistory.length - 2;
      while(latest.timestamp - previous.timestamp < 12 * 60 * 60e3) {
        let newPrevious = data.stockHistory[--i];
        if(!newPrevious) break;
        let newPreviousStock = JSON.parse(newPrevious.stock)[k];
        if(newPreviousStock < currentStock) break;
        previous = newPrevious;
        previousStock = newPreviousStock;
      }

      const timeDiff = latest.timestamp - previous.timestamp;
      const stockDiff = previousStock - currentStock;

      const salesPerHour = stockDiff / (timeDiff / (60 * 60e3));
      const goneIn = (currentStock / salesPerHour) - ((Date.now() - data.product.stockChecked) / (60 * 60e3));
      return {
        name: k,
        salesPerHour,
        goneIn,
        currentStock
      }
  }).filter(v => typeof v !== "undefined"));

  let strippedTitle = $derived(productInfo.title.replace(/\(.*\)/g, "").replace("Knife", "Knive").trim());

  let productDiscounts = $derived(JSON.parse(data.product.productDiscount ?? "[]"));

  let backorderNotices = $state(new Set());
  run(() => {
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
  });


  let historyDays = $state(data.historyDays+"");
  let first = $state(true);
  run(() => {
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
  });
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Watcher</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/products">Products</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb">{productInfo.title}</li>
</ol>

<svelte:head>
  <title>{data.product.title} - Whenplane LTTStore Watcher</title>
  <meta name="description" content={truncateText(sanitizeHtml(productInfo.description ?? productDetailModules?.[0]?.content ?? "", {allowedTags: []}), 159)}>
  {#if productInfo.featured_image}
    <meta property="og:image" content={productInfo.featured_image}>
  {/if}
</svelte:head>

<div class="container mx-auto p-2 pt-8 mb-64">

  <h1 class:line-through={!data.product.available}>{productInfo.title}</h1>
  <div class=" overflow-y-visible overflow-x-auto pr-64 edge-fade" style="text-wrap: nowrap;">
    {#each productInfo.media as image}
      {#if image.media_type === "image"}
        <a href={image.src} class="m-1 no-underline!">
          <img src={image.src} class="product-image inline-block" alt={image.alt} title={image.alt} width={image.width} height={image.height} />
        </a>
      {/if}
    {/each}
  </div>
  <!--{#if productInfo.featured_image}
    <img src={productInfo.featured_image} class="product-image" alt={productInfo.title}/>
  {:else}
    No featured image
  {/if}-->
  {#if (!productInfo.compare_at_price || productInfo.price === productInfo.compare_at_price) && typeof productInfo.price === "number"}
    <Price usd={productInfo.price/100}/>
  {:else if typeof productInfo.price === "number" && productInfo.compare_at_price}
    <span class="old-price">
      <Price usd={productInfo.compare_at_price/100}/>
    </span>
    <Price usd={productInfo.price/100}/>
  {/if}
  <br>
  <br>
  {#if typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock?.total ?? -1) < 0) && (currentStock?.total ?? -1) !== 500000 && Date.now() - data.product.stockChecked < (7 * 24 * 60 * 60e3)}
    Average of {Math.round(data.product?.purchasesPerHour * 100)/100} sold per hour recently.<br>
  {/if}
  {#if typeof data.product?.purchasesPerDay === "number" && data.product?.purchasesPerDay >= 0 && !(data.product?.purchasesPerDay === 0 && (currentStock?.total ?? -1) < 0) && (currentStock?.total ?? -1) !== 500000 && Date.now() - data.product.stockChecked < (7 * 24 * 60 * 60e3)}
    Average of {Math.round(data.product?.purchasesPerDay * 100)/100} sold per day.<br>
  {/if}
  <br>
  <br>
  <a href="https://www.lttstore.com/products/{data.product?.handle}" class:!line-through={!data.product.available}>
    View or Buy on lttstore.com
  </a>
  {#if !data.product.available}
    <br>
    This product appears to no longer be on lttstore.com. It is preserved here for archival purposes.<br>
    Usually this happens when a product is retired and will not be coming back.
  {/if}

  {#if productInfo.description}
    <div class="max-w-xl my-4">
      <Accordion class="mx-4" spacing="" regionPanel="">
        <Accordion.Item>
          {#snippet summary()}
                    Item Description
                  {/snippet}
          {#snippet content()}
                  
              <div class="item-description">
                {@html sanitizeHtml(productInfo.description, newsSanitizeSettings)}
              </div>
            
                  {/snippet}
        </Accordion.Item>
      </Accordion>
    </div>
  {/if}
  {#if data.product.productDetailModules}
    {#each productDetailModules as detailModule}
      <div class="max-w-xl my-4">
        <Accordion class="mx-4" spacing="" regionPanel="">
          <Accordion.Item>
            {#snippet summary()}
                        {detailModule.title}
                      {/snippet}
            {#snippet content()}
                      
                <div class="item-description">
                  {@html sanitizeHtml(detailModule.content, newsSanitizeSettings)}
                </div>
              
                      {/snippet}
          </Accordion.Item>
        </Accordion>
      </div>
    {/each}
  {/if}
  <br>
  <br>
  <div class="max-w-3xl my-4">
    <Accordion class="mx-4" spacing="" regionPanel="">
      <Accordion.Item>
        {#snippet summary()}
                Product Metadata
              {/snippet}
        {#snippet content()}
              
            <h2>Whenplane Metadata</h2>
            <table class="padded-table">
              <thead></thead>
              <tbody>
              <tr>
                <td>Last Metadata update</td>
                <td><DateStamp epochSeconds={(data.product.metadataUpdate && data.product.metadataUpdate > 0 ? data.product.metadataUpdate : data.product.stockChecked) / 1e3}/></td>
              </tr>
                <tr>
                  <td>Last Stock Check</td>
                  <td>
                    {#if data.product.stockChecked}
                      <DateStamp epochSeconds={data.product.stockChecked / 1e3}/>
                    {:else}
                      <span class="opacity-70">N/A</span>
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td>Last Restock Detected</td>
                  <td>
                    {#if data.product.lastRestock > 0}
                      <DateStamp epochSeconds={data.product.lastRestock / 1e3}/>
                    {:else}
                      <span class="opacity-70">[none]</span>
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td>Average Purchases Per Hour</td>
                  <td>
                    {#if data.product.purchasesPerHour >= 0}
                      {data.product.purchasesPerHour}
                    {:else}
                      <span class="opacity-70">N/A</span>
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td>Average Purchases Per Day</td>
                  <td>
                    {#if data.product.purchasesPerDay >= 0}
                      {data.product.purchasesPerDay}
                    {:else}
                      <span class="opacity-70">N/A</span>
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td>Regular Price</td>
                  <td><Price usd={data.product.regularPrice/100}/></td>
                </tr>
                <tr>
                  <td>Current Price</td>
                  <td><Price usd={data.product.currentPrice/100}/></td>
                </tr>
                <tr>
                  <td>First Seen</td>
                  <td><DateStamp epochSeconds={data.product.firstSeen / 1e3}/></td>
                </tr>
                <tr>
                  <td>On lttstore?</td>
                  <td>{data.product.available ? "yes" : "no"}</td>
                </tr>
              </tbody>
            </table>
            <br>
            <h2>LTTStore Metadata</h2>
            <table class="padded-table">
              <thead></thead>
              <tbody>
                <tr>
                  <td>ID</td>
                  <td>{data.product.id}</td>
                </tr>
                <tr>
                  <td>Title</td>
                  <td>{data.product.title}</td>
                </tr>
                <tr>
                  <td>Handle</td>
                  <td>{data.product.handle}</td>
                </tr>
                <tr>
                  <td>Creation Date</td>
                  <td><DateStamp epochSeconds={new Date(productInfo.created_at).getTime() / 1e3}/></td>
                </tr>
                <tr>
                  <td class="pr-8">Publication Date</td>
                  <td><DateStamp epochSeconds={new Date(productInfo.published_at).getTime() / 1e3}/></td>
                </tr>
                <tr>
                  <td>Vendor</td>
                  <td>{productInfo.vendor}</td>
                </tr>
                <tr>
                  <td>Type</td>
                  <td>{productInfo.type}</td>
                </tr>
                <tr>
                  <td class="align-top">Tags</td>
                  <td>
                    {#if productInfo.tags}
                      <ul>
                        {#each productInfo.tags as tag}
                          <li>{tag}</li>
                        {:else}
                          <span class="opacity-70">[none]</span>
                        {/each}
                      </ul>
                    {:else}
                      <span class="opacity-70">[none]</span>
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td>Price</td>
                  <td><Price usd={productInfo.price/100}/></td>
                </tr>
                <tr>
                  <td>Compare Price</td>
                  <td>
                    {#if productInfo.compare_at_price}
                      <Price usd={productInfo.compare_at_price/100}/>
                    {:else}
                      <span class="opacity-70">[none]</span>
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td>In stock?</td>
                  <td>{productInfo.available}</td>
                </tr>
                <tr>
                  <td class="align-top">Options</td>
                  <td>
                    <ul>
                      {#each productInfo.options as option}
                        <li>
                          {option.name}
                          <ul class="list-[circle]!">
                            {#each option.values as value}
                              <li>{value}</li>
                            {/each}
                          </ul>
                        </li>
                      {:else}
                        <span class="opacity-70">[none]</span>
                      {/each}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td class="align-top">Variants</td>
                  <td>
                    {#each productInfo.variants as variant}
                      <li>
                        {variant.title}
                        <table class="ml-3 padded-table">
                          <thead></thead>
                          <tbody>
                            <tr>
                              <td>Title</td>
                              <td>{variant.title}</td>
                            </tr>
                            <tr>
                              <td>Name</td>
                              <td>{variant.name}</td>
                            </tr>
                            <tr>
                              <td>SKU</td>
                              <td>{variant.sku}</td>
                            </tr>
                            <tr>
                              <td>In stock?</td>
                              <td>{variant.available}</td>
                            </tr>
                            <tr>
                              <td class="align-top">Options</td>
                              <td>
                                <ul class="list-[circle]!">
                                  {#each variant.options as value}
                                    <li>{value}</li>
                                  {/each}
                                </ul>
                              </td>
                            </tr>
                            <tr>
                              <td>Price</td>
                              <td><Price usd={variant.price/100}/></td>
                            </tr>
                            <tr>
                              <td>Compare at price</td>
                              <td>
                                {#if variant.compare_at_price}
                                  <Price usd={(variant.compare_at_price)/100}/>
                                {:else}
                                  <span class="opacity-70">[none]</span>
                                {/if}
                              </td>
                            </tr>
                            <tr>
                              <td>Requires Shipping?</td>
                              <td>{variant.requires_shipping}</td>
                            </tr>
                            <tr>
                              <td>Taxable?</td>
                              <td>{variant.taxable}</td>
                            </tr>
                            <tr>
                              <td>Weight (g)</td>
                              <td>{variant.weight}</td>
                            </tr>
                            <tr>
                              <td>Inventory Management</td>
                              <td>{variant.inventory_management}</td>
                            </tr>
                            {#if variant.barcode}
                              <tr>
                                <td>Barcode</td>
                                <td>{variant.barcode}</td>
                              </tr>
                            {/if}
                            <tr>
                              <td>Minimum Quantity</td>
                              <td>{variant.quantity_rule.min}</td>
                            </tr>
                            <tr>
                              <td>Maximum Quantity</td>
                              <td>
                                {#if variant.quantity_rule.max !== null}
                                  {variant.quantity_rule.min}
                                {:else}
                                  <span class="opacity-70">[none]</span>
                                {/if}
                              </td>
                            </tr>
                            <tr>
                              <td>Quantity Increment</td>
                              <td>{variant.quantity_rule.increment}</td>
                            </tr>
                          </tbody>
                        </table>
                      </li>
                    {:else}
                      <span class="opacity-70">[none]</span>
                    {/each}
                  </td>
                </tr>
              </tbody>
            </table>
          
              {/snippet}
      </Accordion.Item>
    </Accordion>
  </div>
  <br>

  <div class="max-w-4xl my-4">
    <Accordion class="mx-4" spacing="" regionPanel="">
      <Accordion.Item open>
        {#snippet summary()}
              
            Similar Products
            <ToolTip id="similar-products">
              Whenplane uses an AI embedding model to determine products that are similar to each other.<br>
              The product description is used for comparison, so products with similar descriptions will show as similar to each other.<br>
              These similar products were last updated
              {#await data.similarProducts}
                <div class="inline-block w-32 placeholder animate-pulse align-bottom rounded-md"></div>
              {:then similarProducts}
                <DateStamp epochSeconds={similarProducts.timestamp/1e3}/>
              {/await}
              <br>
              Similar products are updated roughly every 7 days.
            </ToolTip>
          
              {/snippet}
        {#snippet content()}
              
            {#key data}
              <div class="min-h-[298px] overflow-y-visible overflow-x-auto pr-64 edge-fade" style="text-wrap: nowrap;">
                {#await data.similarProducts}
                  ...
                {:then similarProducts}
                  {#each similarProducts?.similar as similar (similar.id)}
                    {@const product = similar.metadata.product}
                    <LTTProductCard {product} available={similar.metadata.available} />
                  {/each}
                {/await}
              </div>
            {/key}
          
              {/snippet}
      </Accordion.Item>
    </Accordion>
  </div>
  <br>
  <br>
  <br>

  {#if (currentStock?.total ?? -1) >= 0 && (!data.product.available || Date.now() - data.product.stockChecked < (7 * 24 * 60 * 60e3))}
    <h2>Stock</h2>
    {#if data.product.available}
      Currently there is
    {:else}
      Before this product was removed, there was
    {/if}
    {#if (currentStock.total ?? -1) <= 500000}
      a total of {commas(currentStock?.total)}
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

  {#if productDiscounts.length > 0}
    <h2>Product Discount</h2>
    {#each productDiscounts as productDiscount}
      <aside class="alert preset-tonal border border-surface-500">
        <!-- Icon -->
        <div><Tags width="2em" height="2em"/></div>
        <!-- Message -->
        <div class="alert-message">
          <!--          <h4 class="h4">(title)</h4>-->
          <p class="product-discount-text">
            {@html sanitizeHtml(productDiscount, newsSanitizeSettings)}
          </p>
        </div>
      </aside>
      <br>
    {/each}
  {/if}

  {#if backorderNotices.size > 0}
    <h2>Backorder Notice</h2>
    {#each backorderNotices as backorderNotice}
      <aside class="alert preset-tonal border border-surface-500">
        <div><ExclamationTriangle width="2em" height="2em"/></div>
        <div class="alert-message">
          <p>{backorderNotice}</p>
        </div>
      </aside>
      <br>
    {/each}
    <br>
    <br>
  {/if}

  <Accordion>
    <Accordion.Item open={dev}>
      {#snippet summary()}
            Stock History
          {/snippet}
      {#snippet content()}
          
          <h2>Stock History</h2>
          <div class="limit mx-auto p-2 m-2 card preset-tonal-warning border border-warning-500">
            Due to a <a href="https://changelog.shopify.com/posts/new-add-to-cart-limit">Shopify change</a>,
            we are not longer able to see stock of most products if theyre above <span class="font-mono">40</span>.
            <br>
            Please <a href="/support">let me know</a> if you find a new way to check the stock.
          </div>
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
          <ProductMoveRateGraph stockHistory={data.stockHistory} productName={productInfo.title} {chartUpdateNumber}/>
          <br>
          {#if data.product.firstSeen < 1719248750000}
            Note that stock started being recorded on June 11th, 2024, so data before that is not available.
          {/if}
          <br>
          <br>
          <br>
          {#if goneInHours > 0 && (currentStock?.total ?? -1) > 0 && (currentStock?.total ?? -1) <= 500000 && typeof data.product?.purchasesPerHour === "number" && data.product?.purchasesPerHour >= 0 && !(data.product?.purchasesPerHour === 0 && (currentStock?.total ?? -1) < 0)}
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
            {#each variantsGoneIn as variantGoneIn}
              {@const goneInHours = variantGoneIn.goneIn}
              {#if typeof variantGoneIn.salesPerHour === "number" && variantGoneIn.salesPerHour >= 0 && variantGoneIn.currentStock > 0}
                If <b>{variantGoneIn.name}</b> keeps selling at {Math.round(variantGoneIn.salesPerHour * 100)/100} units per hour,
                it could be gone in
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
              {/if}
            {/each}
            <br>
          {/if}
        
          {/snippet}
    </Accordion.Item>
  </Accordion>
  <br>
  <br>
  <br>
  <h2 id="change-history">Change history</h2>
  {#await data.changeHistory}

  {:then changeHistory}
    <div class="table-container rounded-md">
      <table class="table  rounded-md">
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
          {@const SvelteComponent = getDiffComponent(change.field)}
          {@const SvelteComponent_1 = getDiffComponent(change.field)}
          <tr>
            <td>{getFieldName(change.field)}</td>
            <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
            <td><SvelteComponent before={change.old} after={change.new} displaying="before"/></td>
            <td><SvelteComponent_1 before={change.old} after={change.new} displaying="after"/></td>
          </tr>
        {/each}
        </tbody>
        {#if data.product.firstSeen < 1727147700624}
          <tfoot>
          <tr style="text-transform: initial !important;">
            <td class="p-2! opacity-70" colspan="3">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
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
  If your request is successful, it usually takes between 30 seconds and 15 minutes for the data to appear on this page. You will need to reload.<br>
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
    similar:
    {#await data.similarProducts}
      ...
    {:then similar}
      <pre>{JSON.stringify(similar, undefined, '\t')}</pre>
    {/await}
  {/if}
</div>

<style>
  .product-image {
      height: 15em;
      width: auto;
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
  ul {
      list-style: initial;
      padding-left: 1.5em;
  }

  .padded-table td {
      padding-right: 1em;
  }

  .product-discount-text > :global(hr) {
      margin: 1rem;
  }

  .edge-fade {
      --mask: linear-gradient(to right,
          rgba(0,0,0, 1) 0,   rgba(0,0,0, 1) 90%,
          rgba(0,0,0, 0) 100%, rgba(0,0,0, 0) 0
        ) 100% 50% / 100% 100% repeat-x;
      -webkit-mask: var(--mask);
      mask: var(--mask);
  }
</style>