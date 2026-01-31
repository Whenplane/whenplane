<script lang="ts">
  let { data } = $props();
</script>

<div class="p-2">
  {#each data.products as product}
    {@const meta = JSON.parse(product.product)}
    <a href="/lttstore/products/{product.handle}">{product.title}</a> -
    {#each meta.variants as variant}
      {variant.sku}&nbsp;
    {/each}
    <br>
  {/each}
</div>