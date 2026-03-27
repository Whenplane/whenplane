<script lang="ts">
	import type { ShopifyProduct, StockCounts } from '$lib/lttstore/lttstore_types.ts';
	import Price from '$lib/lttstore/Price.svelte';
	import LargerLazyLoad from '$lib/LargerLazyLoad.svelte';
	import { productRedirects } from '$lib/lttstore/product_redirects.ts';
	import { typed } from '$lib';
	import { dev } from "$app/environment";
	import { sha256 } from "$lib/utils.ts";

	let {
		product = typed<ShopifyProduct>(),
		shortTitle = typed<string | null>(),
		stock = typed<StockCounts | undefined>(),
		purchasesPerHour = typed<number | undefined>(),
		goneIn = typed<boolean>(false),
		available = typed<boolean>(true),
		lazyLoadImage = typed<boolean>(false)
	} = $props();

	let goneInHours = $derived((stock?.total ?? -1) / (purchasesPerHour ?? -1));

	let handle = $derived(productRedirects[product.handle] ?? product.handle);
	let imageSrc = $derived(
			(dev ? 'https://whenplane.com' : '') +
			'/cdn-cgi/image/anim=false,fit=scale-down,width=528,metadata=copyright,q=60,sqc=50,format=auto/' +
			`https://img-proxy.whenplane.com/img/${product.handle}-${await sha256(product.featured_image).then(r => r.substring(0, 5))}`
		);

	const title = $derived(shortTitle ?? product.title);
</script>

<a
	class="card inline-block p-2 m-1 w-48 align-top h-full"
	href="/lttstore/products/{handle}"
	class:opacity-50={!available}
>
	{#if product.featured_image}
		{#if lazyLoadImage}
			<LargerLazyLoad>
				<img
					src={imageSrc}
					class="product-image rounded-xl h-47"
					alt={title}
					decoding="async"
				/>
			</LargerLazyLoad>
		{:else}
			<img
				src={imageSrc}
				class="product-image rounded-xl h-47"
				alt={title}
				loading="lazy"
				decoding="async"
			/>
		{/if}
	{:else}
		No featured image
	{/if}
	<div class="inline-block title" class:line-through={!available}>
		{title}
	</div>
	{#if product.price}
		<br />
		{#if !product.compare_at_price || product.price === product.compare_at_price}
			<Price usd={product.price / 100} />
		{:else}
			<span class="old-price">
				<Price usd={product.compare_at_price / 100} />
			</span>
			<Price usd={product.price / 100} />
		{/if}
	{/if}
	{#if goneIn && stock && goneInHours < 10 && goneInHours >= 0}
		<div class="opacity-80">
			Could be gone in {Math.round(goneInHours)}h
		</div>
	{/if}
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
