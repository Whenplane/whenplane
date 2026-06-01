<script lang="ts">
  import type { ProductsTableRow, ShopifyProduct, StockCounts } from "$lib/lttstore/lttstore_types.ts";
  import { dev } from "$app/environment";
  import { commas, sha256 } from "$lib/utils.ts";

  const noImages = ["Size", "Inseam", "Waist size", "Length", "Title"];

  let {product, stock, meta}: {
    product: ShopifyProduct,
    stock: StockCounts,
    meta: ProductsTableRow
  } = $props();
</script>

<h2>Options / Variants</h2>
{#each product.options as option}
  {#if option.name !== "Title" || product.options.length > 1}
    <h3>{option.name}</h3>
  {/if}
  <div class="overflow-x-auto pr-64 edge-fade">
    <div class="flex w-fit">
      {#each option.values as value}
        {@const variants = product.variants.filter(v => v.options[option.position-1] === value)}
        {@const variant = variants.find(v => v.featured_media) ?? variants[0]}
        {@const inStock = !!variants.find(v => v.available)}
        {@const tag = `#${option.name.toLowerCase()}_${value.toLowerCase()}`}
        {@const image = product.media.find(m => m.alt?.includes(tag)) ??
          (
            variant.featured_media &&
            product.media.find(m => m.id === variant.featured_media!.id)!
          ) ??
          (option.name.toLowerCase().includes("color") && option.values.length === 1 && product.media[0]) // If only one color option and it wasnt marked, just use the first image
        }
        <div class={[
        "card px-2 py-1 inline-flex m-1 flex-col",
        (option.values.length > 1 || product.options.length > 1) && (
          !noImages.includes(option.name) ? "w-35" : "max-w-full"
        )
      ]}>
          {#if !noImages.includes(option.name) || value.includes("oz") || value.includes("mm")}
            {#if image}
              {@const preview = (dev ? 'https://whenplane.com' : '') +
                `/cdn-cgi/image/fit=scale-down,height=384,metadata=copyright,q=80,sqc=65,format=auto,${image.src.includes("jpg") && !product.title.toLowerCase().includes("desk") ? "segment=foreground," : ""}onerror=redirect/` +
                `https://img-proxy.whenplane.com/d-img/${product.handle}-${image.id}-${await sha256(image.src).then(r => r.substring(0, 5))}`}
              <a href={image.src} class="no-underline! text-center h-full flex justify-center items-center">
                <img
                  src={preview}
                  class="product-image inline-block w-35 h-full object-cover"
                  alt={image.alt}
                  title={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  fetchpriority="low"
                  decoding="async"
                />
              </a>
            {:else}
              {@const otherOptionVariants = product.variants.filter(v => v.options[option.position-1] !== value && v.featured_media)}
              {#if otherOptionVariants.length > 0}
                <div class="flex justify-center items-center h-full w-full opacity-40 text-xs">
                  No Image
                </div>
              {/if}
            {/if}
          {/if}
          <a href="https://www.lttstore.com/products/{product.handle}?variant={variant?.id}" class="hidden-link block w-full mt-auto" class:opacity-60={!inStock}>
            {#if value === "Default Title"}
              {meta.shortTitle ?? product.title}
            {:else}
              {value}
            {/if}
            <div class="text-xs opacity-70">
              {#if !inStock}
                Out of stock
              {:else}
                {@const variantTitles = variants.map(v => v.title)}
                {@const total = Object.entries(stock).reduce((acc, [k, v]) => variantTitles.includes(k) ? acc + v : acc, 0)}
                {commas(total)} in stock
              {/if}
            </div>
          </a>
        </div>
      {/each}
    </div>
  </div>
{/each}