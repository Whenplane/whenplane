<script lang="ts">
  import type {
    BackorderAlerts,
    ProductDetailModule,
    ShopifyProduct,
    StockCounts
  } from "$lib/lttstore/lttstore_types.ts";
  import { page } from "$app/state";
  import ProductStockHistoryGraph from "$lib/lttstore/product/ProductStockHistoryGraph.svelte";
  import DateStamp from "$lib/DateStamp.svelte";
  import { commas, sha256, truncateText } from "$lib/utils.ts";
  import { Accordion } from "@skeletonlabs/skeleton-svelte";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news";
  import { goto, invalidateAll } from "$app/navigation";
  import Price from "$lib/lttstore/Price.svelte";
  import { dev } from "$app/environment";
  import ProductUpdateRequestButton from "$lib/lttstore/product/ProductUpdateRequestButton.svelte";
  import ExclamationTriangle from "svelte-bootstrap-icons/lib/ExclamationTriangle.svelte";
  import Tags from "svelte-bootstrap-icons/lib/Tags.svelte";
  import ChevronDown from "svelte-bootstrap-icons/lib/ChevronDown.svelte";
  import ProductMoveRateGraph from "$lib/lttstore/product/ProductMoveRateGraph.svelte";
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import ToolTip from "$lib/ToolTip.svelte";
  import { sum } from "$lib/lttstore";
  import ProductChangeHistory from "./ProductChangeHistory.svelte";
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import {slide} from "svelte/transition";
  import NProgress from "nprogress";

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

  let backorderNotices = $derived.by(() => {
    const set = new Set<string>();
    let backorderAlerts = JSON.parse(data.product?.backorderAlerts) as BackorderAlerts;
    if(backorderAlerts) {
      Object.values(backorderAlerts).forEach(alert => {
        if(alert && alert.trim()) {
          set.add(alert)
        }
      });
    }
    return set;
  })


  let historyDays = $state(data.historyDays+"");
  let first = !page.url.searchParams.has("historyDays");
  $effect(() => {
    historyDays;
    if(first) {
      first = false;
    } else {
      const newUrl = new URL(location.href);
      newUrl.searchParams.set("historyDays", historyDays+"")

      goto(newUrl.toString(), { noScroll: true } ).then(() => {
        chartUpdateNumber++;
      })

      // For some reason the charts refuse to update when doing this
      // history.pushState({}, document.title, newUrl.toString());
      // NProgress.start();
      // invalidateAll().then(() => {
      //   NProgress.done();
      //   chartUpdateNumber++;
      // });
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
  <li class="crumb">{data.product.shortTitle ?? data.product.title}</li>
</ol>

<svelte:head>
  <title>{data.product.shortTitle ?? data.product.title} - Whenplane LTTStore Watcher</title>
  <meta name="description" content={truncateText(sanitizeHtml(productInfo.description ?? productDetailModules?.[0]?.content ?? "", {allowedTags: []}), 159)}>
  {#if productInfo.featured_image}
    <meta property="og:image" content={productInfo.featured_image}>
  {/if}
</svelte:head>

<div class="container mx-auto p-2 pt-8 mb-64">

  <h1 class:line-through={!data.product.available}>{productInfo.title}</h1>
  <div class=" overflow-y-visible overflow-x-auto pr-64 edge-fade" style="text-wrap: nowrap;">
    {#each productInfo.media as image, i (image.id ?? (image.src))}
      {#if image.media_type === "image"}
        {@const preview = (dev ? 'https://whenplane.com' : '') +
          '/cdn-cgi/image/fit=scale-down,height=960,metadata=copyright,q=80,sqc=65,format=auto,onerror=redirect/' +
          `https://img-proxy.whenplane.com/d-img/${productInfo.handle}-${image.id}-${await sha256(image.src).then(r => r.substring(0, 5))}`}
        <a href={image.src} class="m-1 no-underline!">
          <img
            src={preview}
            class="product-image inline-block"
            alt={image.alt}
            title={image.alt}
            width={image.width}
            height={image.height}
            loading={i === 0 ? "eager" : "lazy"}
            fetchpriority={i === 0 ? "high" : "low"}
            decoding={i === 0 ? "sync" : "async"}
          />
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
    <div class="max-w-xl mt-4 mb-2.5">
      <Accordion class="mx-4" collapsible>
        <Accordion.Item value="description">
          <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
            Item Description
            <Accordion.ItemIndicator class="group">
              <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
            </Accordion.ItemIndicator>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            {#snippet element(attributes)}
              {#if !attributes.hidden}
                <div class="bordered-accordion-content px-2 item-description" transition:slide>
                  {@html sanitizeHtml(productInfo.description, newsSanitizeSettings)}
                </div>
              {/if}
            {/snippet}
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion>
    </div>
  {/if}
  {#if data.product.productDetailModules}
    {#each productDetailModules as detailModule, i}
      <div class="max-w-xl my-2.5">
        <Accordion class="mx-4" collapsible>
          <Accordion.Item value="detail-{i}">
            <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
              {detailModule.title}
              <Accordion.ItemIndicator class="group">
                <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              {#snippet element(attributes)}
                {#if !attributes.hidden}
                  <div class="bordered-accordion-content px-2 item-description" transition:slide>
                    {@html sanitizeHtml(detailModule.content, newsSanitizeSettings)}
                  </div>
                {/if}
              {/snippet}
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion>
      </div>
    {/each}
  {/if}
  <br>
  <br>
  <div class="max-w-3xl my-4">
    <Accordion class="mx-4" collapsible>
      <Accordion.Item value="metadata">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          Product Metadata
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div class="bordered-accordion-content px-2" transition:slide>
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
                    <tr>
                      <td>
                        Short Title
                        <ToolTip id="short-title">
                          If a product title is very long, Whenplane might generate a shortened version.
                          This shortened title is used where title space may be limited, such as the browser tab and product cards.<br>
                          The main header on the product page will always use the full/original title.
                        </ToolTip>
                      </td>
                      <td>
                        {#if data.product.shortTitle}
                          {data.product.shortTitle}
                        {:else}
                          <span class="opacity-70">[none]</span>
                        {/if}
                      </td>
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
                      <td class="align-top">Variants ({productInfo.variants.length})</td>
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
                                {#if variant.quantity_rule}
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
                                {:else}
                                  <tr>
                                    <td>Quantity Rule</td>
                                    <td><span class="opacity-70">N/A</span></td>
                                  </tr>
                                {/if}
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
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion>
  </div>
  <br>

  <div class="my-4">
    <Accordion class="mx-4" collapsible defaultValue={["similar"]}>
      <Accordion.Item value="similar">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          <span>
            Similar Products
            &nbsp;
            <ToolTip id="similar-products">
              Whenplane uses an AI embedding model to determine products that are similar to each other.<br>
              The product description is used for comparison, so products with similar descriptions will show as similar to each other.<br>
              These similar products were last updated
              {#await data.similarProducts}
                <div class="inline-block w-32 placeholder animate-pulse align-bottom rounded-md"></div>
              {:then similarProducts}
                {#if similarProducts}
                  <DateStamp epochSeconds={similarProducts.timestamp/1e3}/>
                {/if}
              {/await}
              <br>
              Similar products are updated roughly every 7 days.
            </ToolTip>
          </span>
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div class="bordered-accordion-content px-2" transition:slide>
                {#key data}
                  <div class="min-h-[298px] overflow-y-visible overflow-x-auto pr-64 edge-fade" style="text-wrap: nowrap;">
                    {#await data.similarProducts}
                      ...
                    {:then similarProducts}
                      {#each similarProducts?.similar as similar (similar.id)}
                        {@const product = similar.metadata.product}
                        <LTTProductCard {product} shortTitle={product.shortTitle} available={similar.metadata.available} />
                      {/each}
                    {/await}
                  </div>
                {/key}
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion>
  </div>
  <br>
  <br>
  <br>

  {#if (!data.product.available || Date.now() - data.product.stockChecked < (7 * 24 * 60 * 60e3))}
    <h2>Stock</h2>
    {#if (currentStock?.total ?? -1) >= 0}
      {#if data.product.available}
        Currently there is
      {:else}
        Before this product was removed, there was
      {/if}
      {#if (currentStock.total ?? -1) <= 500000}
        {#if (currentStock.total ?? -1) === -1}
          more than {commas(sum(currentStock))}
        {:else}
          a total of {commas(currentStock?.total)}
        {/if}
      {:else}
        more than 500,000
      {/if}

      {strippedTitle}{currentStock.total === 1 || strippedTitle.endsWith("s") ? "" : "s"}
      in stock.
      <br>
    {/if}
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

  <Accordion collapsible defaultValue={["stock-history"]}>
    <Accordion.Item value="stock-history">
      <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
        Stock History
        <Accordion.ItemIndicator class="group">
          <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div transition:slide={{duration: 1e3}} class="bordered-accordion-content px-2">
              <h2>Stock History</h2>
              <!--<div class="limit mx-auto p-2 m-2 card preset-tonal-warning border border-warning-500">
                Due to a <a href="https://changelog.shopify.com/posts/new-add-to-cart-limit">Shopify change</a>,
                we are not longer able to see stock of most products if theyre above <span class="font-mono">40</span>.
                <br>
                Please <a href="/support">let me know</a> if you find a new way to check the stock.
              </div>-->
              We check the stock of products occasionally. Here is the history of those stock numbers.
              <!-- stock started being recorded on 1718147742676 -->
              <select class="select inline-block w-48 px-2 bg-surface-900" bind:value={historyDays}>
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
              {#key data}
                <ProductStockHistoryGraph stockHistory={data.stockHistory} productName={productInfo.title} productOptions={productInfo.options} historyDays={data.historyDays} stockAsOf={data.stockAsOf} {chartUpdateNumber}/>
                <div class="min-h-[710px]">
                  <LazyLoad>
                    <ProductMoveRateGraph stockHistory={data.stockHistory} productName={productInfo.title} historyDays={data.historyDays} stockAsOf={data.stockAsOf} {chartUpdateNumber}/>
                  </LazyLoad>
                </div>
              {/key}
              <br>
              {#if data.product.firstSeen < 1719248750000}
                Note that stock started being recorded on June 11th, 2024, so data before that is not available.
              {/if}
              <br>
              {#if data.product.stockChecked > 1743807304846}
                Note that stock data between April 3rd, 2025 and March 5th, 2026 is not available, because we were not able to check the stock during that time.
              {/if}
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
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion>
  <br>
  <br>
  <br>
  <Accordion collapsible defaultValue={["change-history"]}>
    <Accordion.Item value="change-history">
      <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
        Change History
        <Accordion.ItemIndicator class="group">
          <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div transition:slide class="bordered-accordion-content px-2">
              <h2 id="change-history">Change history</h2>
              {#await data.changeHistory}
                <ProductChangeHistory changeHistory={null} product={data.product}/>
              {:then changeHistory}
                <ProductChangeHistory {changeHistory} product={data.product}/>
              {/await}
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion>
  <br>
  <br>
  <br>
  <h2 id="request-update">Request update</h2>
  If you want more up-to-date data for this product, you can request an update below.<br>
  To prevent abuse, you can only request updates once an hour per product, and 30 minutes between a request for any product.<br>
  <br>
  If your request is successful, it usually takes between 30 seconds and 15 minutes for the data to appear on this page. You will need to reload.<br>
  <br>

  <ProductUpdateRequestButton/>

  {#if dev}
    <br>
    <Accordion collapsible>
      <Accordion.Item value="debug-page-data">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          Debug: Page Data
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div transition:slide class="bordered-accordion-content px-2">
                <pre>{JSON.stringify({
                  ...data,
                  product: "shown below",
                  stockHistory: "shown below"
                }, undefined, '\t')}</pre>
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
      <Accordion.Item value="debug-stock-history">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          Debug: Stock History
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div transition:slide class="bordered-accordion-content px-2">
                <pre>{JSON.stringify(data.stockHistory, undefined, '\t')}</pre>
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
      <Accordion.Item value="debug-product-data">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          Debug: Product Data
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div transition:slide class="bordered-accordion-content px-2">
                <pre>{JSON.stringify({
                  ...data.product,
                  product: "shown below"
                }, undefined, '\t')}</pre>
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
      <Accordion.Item value="debug-product-info">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          Debug: Product Info
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div transition:slide class="bordered-accordion-content px-2">
                <pre>{JSON.stringify(productInfo, undefined, '\t')}</pre>
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
      <Accordion.Item value="debug-similar-products">
        <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
          Debug: Similar Products
          <Accordion.ItemIndicator class="group">
            <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div transition:slide class="bordered-accordion-content px-2">
                {#await data.similarProducts}
                  ...
                {:then similar}
                  <pre>{JSON.stringify(similar, undefined, '\t')}</pre>
                {/await}
              </div>
            {/if}
          {/snippet}
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion>
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