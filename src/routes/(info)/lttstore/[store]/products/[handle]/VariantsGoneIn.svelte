<script lang="ts">

  import type { StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";

  let {
    stockHistory,
    stockChecked,
  }: {
    stockHistory: StockHistoryTableRow[],
    stockChecked: number,
  } = $props();

  let variantsGoneIn = $derived(Object.keys(Object.keys(stockHistory).length >= 1 ? JSON.parse(stockHistory[0]?.stock ?? "{}") : {})
    .filter(n => n !== "total") // we already do total above, we dont need to do it again
    .map(k => {
      let previous = stockHistory[stockHistory.length - 2];
      const latest = stockHistory[stockHistory.length - 1];

      if(!previous || !latest) return undefined;

      let previousStock = JSON.parse(previous.stock)[k];
      const currentStock = JSON.parse(latest.stock)[k];

      let i = stockHistory.length - 2;
      while(latest.timestamp - previous.timestamp < 12 * 60 * 60e3) {
        let newPrevious = stockHistory[--i];
        if(!newPrevious) break;
        let newPreviousStock = JSON.parse(newPrevious.stock)[k];
        if(newPreviousStock < currentStock) break;
        previous = newPrevious;
        previousStock = newPreviousStock;
      }

      const timeDiff = latest.timestamp - previous.timestamp;
      const stockDiff = previousStock - currentStock;

      const salesPerHour = stockDiff / (timeDiff / (60 * 60e3));
      const goneIn = (currentStock / salesPerHour) - ((Date.now() - stockChecked) / (60 * 60e3));
      return {
        name: k,
        salesPerHour,
        goneIn,
        currentStock
      }
    }).filter(v => typeof v !== "undefined"));
</script>

{#each variantsGoneIn as variantGoneIn}
  {@const goneInHours = variantGoneIn.goneIn}
  {#if typeof variantGoneIn.salesPerHour === "number" && variantGoneIn.salesPerHour >= 0 && variantGoneIn.currentStock > 0}
    {@const roundedUnits = Math.round(variantGoneIn.salesPerHour * 100)/100}
    If <b>{variantGoneIn.name}</b> keeps selling at {roundedUnits} unit{roundedUnits === 1 ? "" : "s"} per hour,
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