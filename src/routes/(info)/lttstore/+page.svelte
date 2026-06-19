<script lang="ts">
  import USFlag from "./flags/us.webp"
  import Global from "./flags/Global.svelte";
</script>
<svelte:head>
  <title>Select a Store - Whenplane LTTStore Watcher</title>
  <meta name="description" content="Select a store to go to the Whenplane LTTStore Watcher page for that store.">
</svelte:head>
<div class="min-h-dvh flex justify-center items-center text-center px-4">
  <div>
    <h1>Please select a store</h1>
    <div class="my-4 flex justify-center items-center gap-4 flex-wrap">
      <a href="/lttstore/us">
        <img class="max-w-75 w-[95dvw] aspect-19/10 object-fill" src={USFlag} alt="US" />
        United Sates
      </a>
      <a href="/lttstore/global">
        <div class="max-w-75 w-[95dvw]">
          <Global/>
        </div>
        Global
      </a>
    </div>
    <div class="limit mt-8 opacity-70">
      <p>
        Since LTTStore is separated into two separate storefronts, each with their own products and stock,
        Whenplane tracks them separately.
        You can switch between them any time by either going to this page again,
        or there is a button to switch to the other store on the next page.
      </p>
      <p>
        Products from the opposite store may show up in some places (e.g. similar products)
        where they will be marked with the flag (like above) of the opposite store.
      </p>
    </div>
  </div>
</div>
<style>
    @reference "#app.css";
    a {
        @apply block text-inherit;
    }
</style>