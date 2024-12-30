<script lang="ts">
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import { page } from "$app/stores";

  export let data;
</script>
<svelte:head>
  <title>LTTStore Product Archive - Whenplane</title>
  <meta name="description" content="These products are no longer on lttstore. They are preserved here for archival purposes."/>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Watcher</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Product Archive</li>
</ol>

<div class="p-2 mt-8 mb-32">
  <div class="p-2 limit mx-auto">
    <h1>LTTStore Product Archive</h1>
    <br>
    These products are no longer on lttstore. They are preserved here for archival purposes.
  </div>
  <br>
  <div class="p-2">
    {#each data.products as product (product.id)}
      <LTTProductCard product={JSON.parse(product.product)}/>
    {/each}
  </div>
</div>