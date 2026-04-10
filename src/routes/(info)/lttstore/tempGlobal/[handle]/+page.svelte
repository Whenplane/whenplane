<script lang="ts">
  import ProductStockHistoryGraph from "$lib/lttstore/product/ProductStockHistoryGraph.svelte";
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import ProductMoveRateGraph from "$lib/lttstore/product/ProductMoveRateGraph.svelte";
  import { page } from "$app/state";

  let { data } = $props();

  let chartUpdateNumber = $state(1);
</script>

<svelte:head>
  <title>{page.params.handle} - Whenplane LTTStore Watcher</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Watcher</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/products">Temp Global Store Stock Checker</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb">{page.params.handle}</li>
</ol>

<div class="container mx-auto p-2 pt-8 mb-64">
  This is a simple page for checking the stock for a product on the global store before I fully implement the global store watcher.<br>
  <br>
  I started recording global stock before anything else so that once I do go live with the full watcher,
  i'll already have stock history (also stock is kind of a separate system so its the easiest to track by itself)<br>
  <br>
  <br>


  <ProductStockHistoryGraph stockHistory={data.stockHistory} productName={page.params.handle} productOptions={[]} {chartUpdateNumber}/>
  <div class="min-h-[710px]">
    <LazyLoad>
      <ProductMoveRateGraph stockHistory={data.stockHistory} productName={page.params.handle} {chartUpdateNumber}/>
    </LazyLoad>
  </div>
</div>