<script lang="ts">
  export let data;
</script>

{#each data.popularProducts as product}
  {product.title}
{:else}
  No products are being tracked yet!
{/each}