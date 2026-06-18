<script lang="ts">
	import { getStoreMetadata, type ShopifyProduct, type StockCounts, Store } from "$lib/lttstore/lttstore_types.ts";
	import Price from '$lib/lttstore/Price.svelte';
	import { productRedirects } from '$lib/lttstore/product_redirects.ts';
	import { typed } from '$lib';
	import { dev } from "$app/environment";
	import { sha256 } from "$lib/utils.ts";
	import type { Snippet } from "svelte";
	import { page } from "$app/state";

	let {
		product = typed<ShopifyProduct>(),
		shortTitle = typed<string | null>(),
		stock = typed<StockCounts | undefined>(),
		purchasesPerHour = typed<number | undefined>(),
		goneIn = typed<boolean>(false),
		available = typed<boolean>(true),
		lazyLoadImage = typed<boolean>(false),
		detail = typed<Snippet | undefined>(),
		store = typed<number | undefined>()
	} = $props();

	let goneInHours = $derived((stock?.total ?? -1) / (purchasesPerHour ?? -1));

	let handle = $derived(productRedirects[product.handle] ?? product.handle);
	let imageReload = $state(0)
	let imageSrc = $derived(
			(dev ? 'https://whenplane.com' : '') +
			'/cdn-cgi/image/anim=false,fit=scale-down,width=528,metadata=copyright,q=60,sqc=50,format=auto/' +
			`https://img-proxy.whenplane.com/img/${product.handle}-${await sha256(product.featured_image).then(r => r.substring(0, 5))}`
		);

	let title = $derived(shortTitle ?? product.title);

	let storeUrl = $derived(
		typeof store === "undefined" || page.data.store.id === store
			? page.params.store
			: getStoreMetadata(store).storeName.toLowerCase()
	)
</script>

<a
	class="card inline-block p-2 m-1 w-48 align-top h-full"
	href="/lttstore/{storeUrl}/products/{handle}"
	class:opacity-50={!available}
>
	{#if product.featured_image}
		{#key imageReload}
			<img
				src={imageSrc}
				class="product-image rounded-xl h-47"
				alt={title}
				loading={lazyLoadImage ? 'lazy' : undefined}
				decoding="async"
				onerror={() => {
				let delay = (Math.pow(2, imageReload) - 1) + (3 * Math.random());
				if(delay === 0) {
					imageReload++;
				} else {
					console.debug("Retrying image, attempt number " + (imageReload + 1) + ` with a delay of ${delay.toFixed(2)}s`);
					setTimeout(() => imageReload++, delay * 1e3);
				}
			}}
			/>
		{/key}
	{:else}
		No featured image
	{/if}
	<div class="inline-block title" class:line-through={!available}>
		{title}
	</div>
	{#if product.price}
		{@const convert = typeof store === "undefined" || page.data.store.id === store}
		{@const currency = typeof store !== "undefined" && page.data.store.id !== store && (store === Store.US ? "USD" : "CAD")}
		<br />
		{#if !product.compare_at_price || product.price === product.compare_at_price}
			<Price price={product.price / 100} {convert} {currency}/>
		{:else}
			<span class="old-price">
				<Price price={product.compare_at_price / 100} {convert} {currency}/>
			</span>
			<Price price={product.price / 100} {convert} {currency}/>
		{/if}
	{/if}
	{#if goneIn && stock && goneInHours < 10 && goneInHours >= 0}
		<div class="opacity-80">
			Could be gone in {Math.round(goneInHours)}h
		</div>
	{/if}
	{@render detail?.()}
</a>

<style>
	.product-image {
		aspect-ratio: 1 / 1;
		object-fit: cover;
		/*border-radius: 12px;*/
	}
	.title {
		min-height: 3em;
	}

	.old-price {
		opacity: 70%;
		text-decoration: line-through;
	}

	a {
		text-wrap: initial;
		color: inherit;
	}
	a:hover {
		text-decoration: none;
		filter: brightness(1.125);
	}
</style>
