<script lang="ts">
  export let data;
</script>

<div class="container mx-auto">
  {#each data.popularProducts as product}
    <a class="card inline-block p-2" href="/lttstore/products/{product.handle}">
      {product.title}<br>
      {Math.round(Number(product.purchasesPerHour) * 100)/100} purchases per hour
    </a>
  {:else}
    No products are being tracked yet!
  {/each}
</div>