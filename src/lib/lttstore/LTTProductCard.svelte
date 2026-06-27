<script lang="ts">
	import { getStoreMetadata, type ShopifyProduct, type StockCounts, Store } from "$lib/lttstore/lttstore_types.ts";
	import Price from '$lib/lttstore/Price.svelte';
	import { productRedirects } from '$lib/lttstore/product_redirects.ts';
	import { typed } from '$lib';
	import { dev } from "$app/environment";
	import { sha256 } from "$lib/utils.ts";
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import USSmall from "../../routes/(info)/lttstore/flags/us-small.webp"
	import Global from "../../routes/(info)/lttstore/flags/Global.svelte";

	let {
		product = typed<ShopifyProduct & {image?: string}>(),
		shortTitle = typed<string | null>(),
		stock = typed<StockCounts | undefined>(),
		purchasesPerHour = typed<number | undefined>(),
		goneIn = typed<boolean>(false),
		available = typed<boolean>(true),
		lazyLoadImage = typed<boolean>(false),
		detail = typed<Snippet | undefined>(),
		store = typed<number | undefined>(),
		classes = typed<string | undefined>(),
		style = typed<string | undefined>(),
	} = $props();

	let goneInHours = $derived((stock?.total ?? -1) / (purchasesPerHour ?? -1));

	let storeUrl = $derived(
		typeof store === "undefined" || page.data?.store?.id === store
			? page.params.store
			: getStoreMetadata(store).storeName.toLowerCase()
	)

	let handle = $derived(productRedirects[product.handle] ?? product.handle);
	let imageReload = $state(0)
	let imageSrc = $derived(
			(dev ? 'https://whenplane.com' : '') +
			'/cdn-cgi/image/anim=false,fit=scale-down,width=528,metadata=copyright,q=60,sqc=30,format=auto/' +
			`https://img-proxy.whenplane.com/img/${storeUrl}/${product.handle}-${await sha256(product.featured_image ?? product.image).then(r => r.substring(0, 5))}`
		);

	let title = $derived(shortTitle ?? product.title);
</script>

<a
	class="card inline-flex flex-col p-2 m-1 w-48 align-top relative {classes ?? ""}"
	{style}
	href="/lttstore/{storeUrl}/products/{handle}"
	class:opacity-50={!available}
>
	{#if typeof store !== "undefined" && page.data?.store?.id !== store}
		<div class="absolute top-2 right-2 opacity-50 hover:opacity-100">
			{#if store === Store.US}
				{@const title = "On the US store"}
				<img class="w-10 aspect-19/10 object-fill" alt={title} {title} src={USSmall}/>
			{:else}
				<div class="w-10" title="On the Global store">
					<Global/>
				</div>
			{/if}
		</div>
	{/if}
	{#if product.featured_image ?? product.image}
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
	<div class="grow flex items-center">
		<div class="inline-block" class:line-through={!available}>
			{title}
		</div>
	</div>
	<div>
		{#if product.price}
			{@const convert = typeof store === "undefined" || page.data?.store?.id === store}
			{@const currency = typeof store !== "undefined" && page.data?.store?.id !== store && (store === Store.US ? "USD" : "CAD")}
			{#if !product.compare_at_price || product.price === product.compare_at_price}
				<Price price={product.price / 100} {convert} {currency}/>
			{:else}
				<span class="old-price">
					<Price price={product.compare_at_price / 100} {convert} {currency}/>
				</span>
				<Price price={product.price / 100} {convert} {currency}/>
			{/if}
		{/if}
	</div>
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
