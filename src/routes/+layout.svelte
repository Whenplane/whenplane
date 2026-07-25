<!-- @migration task: review uses of `navigating` -->
<script lang="ts">
	import { typed } from '$lib';
	import '../app.css';
	import 'nprogress/nprogress.css';
	import { navigating, page } from '$app/state';
	import NProgress from 'nprogress';
	import { browser, dev } from "$app/environment";
	import { setServiceWorker } from '$lib/stores.ts';
	import { onMount } from 'svelte';
	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { getClockOffset } from "$lib/util/clockOffset.ts";
	import { commas } from "$lib/utils.ts";
	import { fade } from 'svelte/transition';
	import XCircleFill from "svelte-bootstrap-icons/lib/XCircleFill.svelte";
	import X from "svelte-bootstrap-icons/lib/X.svelte";
	import { timeString } from "$lib/timeUtils.ts";

	let { children = typed<import('svelte').Snippet>() } = $props();

	NProgress.configure({
		// Full list: https://github.com/rstacruz/nprogress#configuration
		minimum: 0.16
	});

	let progressTimeout: number;

	beforeNavigate(n => {
		if (progressTimeout) clearTimeout(progressTimeout);
		const startBar = () => {
			if (navigating.type) {
				NProgress.start();
			}
		};
		const toURL = n.to?.url;
		if (toURL?.pathname == '/history' && toURL.searchParams.has('old')) {
			startBar();
		} else {
			progressTimeout = setTimeout(startBar, 150) as unknown as number;
		}
	})

	afterNavigate(() => {
		if (progressTimeout) clearTimeout(progressTimeout);
		NProgress.done();
	})

	let pathname = $derived(page.url.pathname);

	onMount(async () => {
		if ('serviceWorker' in navigator) {
			const options: RegistrationOptions | undefined = dev ? { type: 'module' } : undefined;
			navigator.serviceWorker.register('/service-worker.js', options).then(setServiceWorker);
		}
	});

	const pagesWithDescription = [
		'/',
		'/history',
		'/extension',
		'/ltt-time',
		'/youtube-redirect',
		'/about',
		'/notifications',
		'/boca-marathon',
		'/merch-messages',
		'/search'
	];

	let clockOffset: number | null = $state(null);
	let clockOffsetOpen = $state(true);
	if(browser) {
		getClockOffset()
			.then(offset => {
				console.debug(`Calculated clock offset of ${commas(offset)}ms from the server (only accurate to the second)`)
				clockOffset = offset;
			})
	}
</script>

<!--<svelte:window
  on:load={async () => setServiceWorker(await navigator.serviceWorker.register('/service-worker.js'))}
/>-->

<svelte:head>
	{#if !pathname.startsWith('/history/show/') && !pathname.startsWith('/history/graph') && !pathname.startsWith('/news') && !pagesWithDescription.includes(pathname) && !pathname.startsWith('/lttstore') && !pathname.startsWith('/merch-messages')}
		<meta
			name="description"
			content="When is WAN? Who knows! At least you can look at when it started before.. (spoiler: it's late) and view a countdown until its supposed to start"
		/>
	{/if}
	{#if page.url.hostname !== 'whenplane.com'}
		<link rel="canonical" href="https://whenplane.com{page.url.pathname}" />
	{/if}
</svelte:head>

{#if clockOffset !== null && (dev || clockOffset > 60e3) && clockOffsetOpen}
	<div
		class="fixed top-0 right-0 mt-1 mx-1 card border-2 border-red-600! bg-surface-950/75! p-2 z-100 backdrop-blur-[5px] max-w-dvw"
		transition:fade
	>
		<button class="inline-block absolute top-2 right-6 x" onclick={() => clockOffsetOpen = false}>
			<span class="just-x opacity-40"><X/></span>
			<span class="x-circle"><XCircleFill/></span>
		</button>
		<h1 class="h2! block text-center">Your clock is off!</h1>
		<p>
			Whenplane detected a {timeString(Math.abs(clockOffset), true)?.replaceAll("s ", " ")} difference between your computer (or browser) clock and the server!
		</p>
		<p>
			Your computer/browser clock being off will cause basically all time-related displays on Whenplane to be inaccurate.
		</p>
		<p>
			I highly recommend looking into and fixing this. Feel free to <a href="/support">reach out</a> if you have any questions.
		</p>
	</div>
{/if}

{@render children?.()}

<style>
	@reference "#app.css";
	.x > .x-circle {
		opacity: 0;
	}
	.x > * {
		@apply transition-opacity duration-200;
		position: absolute;
	}

	.x:hover > .just-x {
		opacity: 0;
	}
	.x:hover > .x-circle {
		opacity: 1;
	}
</style>