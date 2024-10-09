<script lang="ts">
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import { browser } from "$app/environment";

  export let productId: number;
  export let initiallyLoad = false;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let promise = new Promise<Response>(() => {});
  let jsonPromise = new Promise<{id: number, handle: string, title: string}>(() => {});

  function loadProduct() {
    promise = fetch("/api/lttstore/products/brief/" + productId, {headers: {"Accept": "application/json"}});
    jsonPromise = promise.then(r => r.json());
  }

  if(initiallyLoad && browser) loadProduct();
</script>
{#await promise}
  <div class="inline-block placeholder animate-pulse text-clear">{productId}</div>
{:then response}
  {#if response.ok}
    {#await jsonPromise}
      <div class="inline-block placeholder animate-pulse text-clear">{productId}</div>
    {:then brief}
      <a href="/lttstore/products/{brief.handle}">
        {brief.title}
      </a>
    {/await}
  {:else}
    {productId} not ok!
  {/if}
{/await}
{#if browser}
  <div style="height: 0; display: inline-block;">
    <div class="relative pointer-events-none" style="bottom: 50em">
      <LazyLoad on:visible={loadProduct} height="50em"/>
    </div>
  </div>
{/if}
<style>
  .text-clear {
      color: rgba(0, 0, 0, 0);
  }
</style>