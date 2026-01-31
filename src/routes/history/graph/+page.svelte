<script>
  import { page } from "$app/state";
</script>

<svelte:head>
  <title>WAN Graphs - {page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
</svelte:head>
<div class="flex w-full h-full items-center justify-items-center">
  <div class="w-full text-center opacity-60">Select a record to the left to see a graph</div>
</div>