<script lang="ts" module>
	import { browser } from "$app/environment";

	let decodeWorker: Worker;
	let resolveFunctions: {[key: string]: (data: any) => void} = {};
	if(browser) {
		decodeWorker = new Worker(new URL('./blurHashWorker.ts', import.meta.url));
		decodeWorker.onmessage = (m: MessageEvent<{id: string, data: any}>) => {
			resolveFunctions[m.data.id]?.(m.data.data);
			delete resolveFunctions[m.data.id];
		}
	}

	function decode(hash: string, w: number, h: number) {
		let id = Date.now().toString(36) + "-" + crypto.randomUUID();
		while(resolveFunctions[id] !== undefined) {
			id = Date.now().toString(36) + "-" + crypto.randomUUID();
		}
		decodeWorker.postMessage({ id, hash, w, h });
		return new Promise<Uint8ClampedArray>((resolve) => {
			resolveFunctions[id] = (result: ArrayBufferLike) => {
				resolve(new Uint8ClampedArray(result))
			};
		})
	}
</script>
<script lang="ts">
	import type { BlurHash } from '$lib/utils.ts';
	import { onMount } from 'svelte';
	import { typed } from '$lib';

	let { blurhash = typed<BlurHash>() } = $props();

	let needsCanvas = $state(true);
	let canvas: HTMLCanvasElement | undefined = $state();
	let imageURL: string | undefined = $state();

	// svelte-ignore state_referenced_locally
		const resolutionDecreaser = blurhash.w > 1000 ? 20 : 1;

	onMount(async () => {
		if(!canvas) {
			console.warn("Missing canvas! Unable to render blurhash!");
			return;
		}
		const pixels = await decode(
			blurhash.hash,
			blurhash.w / resolutionDecreaser,
			blurhash.h / resolutionDecreaser
		);
		if(!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.error('Failed to load canvas context!');
			return;
		}
		const imageData = ctx.createImageData(
			blurhash.w / resolutionDecreaser,
			blurhash.h / resolutionDecreaser
		);

		imageData.data.set(pixels);
		ctx.putImageData(imageData, 0, 0);

		imageURL = canvas.toDataURL();
		needsCanvas = false;
	});
</script>

{#if needsCanvas}
	<canvas
		width={blurhash.w / resolutionDecreaser}
		height={blurhash.h / resolutionDecreaser}
		class="hidden"
		bind:this={canvas}
	></canvas>
{/if}
{#if imageURL}
	<img src={imageURL} alt="" aria-hidden="true" />
{/if}

<style>
	img {
		width: min(28.5rem, 95vw);
		aspect-ratio: 16 / 9;
	}
</style>
