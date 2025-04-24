<script lang="ts">

  import {flip} from "svelte/animate";

  export let data;

  let rankings: {[handle: string]: number} = {}
  let sortedRankings;

  let i = 0;

  $: {
    i;
    for (const product of data.products) {
      const lastStock = JSON.parse(product.stock);
      const velocityInfluence = (product.available && product.purchasesPerHour == -1 ? 100 : product.purchasesPerHour) * (Math.random()/2);
      let distance = (Date.now() - product.stockChecked);
      if(!product.available && distance > 10) distance *= (Math.random()/32)
      rankings[product.handle] = ((distance / (3 * 60 * 60e3)) + velocityInfluence) / (lastStock?.total === 0 ? 100 : (lastStock?.total === -1 ? 10 : 1));
      
    }

    sortedRankings = Object.entries(rankings).sort((a, b) => b[1] - a[1]);
  }
</script>

Data from {data.fetched}

<button class="btn btn-sm variant-filled-surface" on:click={() => {i++;}}>Refresh</button>
<div class="limit mx-auto pt-6">
  {#each sortedRankings as [handle, ranking], i (handle)}
    <span class:opacity-50={i > 20} animate:flip={{ duration: 100 }}>
      <a href="https://whenplane.com/lttstore/products/{handle}">{handle}</a>
      {ranking}
      <br>
    </span>
  {/each}
</div>