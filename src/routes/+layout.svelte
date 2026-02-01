<!-- @migration task: review uses of `navigating` -->
<script lang="ts">
	import { run } from 'svelte/legacy';
	import { typed } from '$lib';



	// Most of your app wide CSS should be put in this file
	import '../app.css';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import 'nprogress/nprogress.css';
	import { navigating, page } from '$app/state';
	import NProgress from 'nprogress';
	import { browser, dev } from '$app/environment';
	import { setServiceWorker } from '$lib/stores.ts';
	import { onMount } from 'svelte';

	import { ToastProvider } from '@skeletonlabs/skeleton-svelte';
	initializeStores();

	let { children = typed<import('svelte').Snippet>() } = $props();

	NProgress.configure({
		// Full list: https://github.com/rstacruz/nprogress#configuration
		minimum: 0.16
	});

	let progressTimeout = $state();

	run(() => {
		if (browser) {
			if (navigating) {
				if (progressTimeout) clearTimeout(progressTimeout);
				const startBar = () => {
					if (navigating) {
						NProgress.start();
					}
				};
				const toURL: URL = navigating.to.url;
				if (toURL.pathname == '/history' && toURL.searchParams.has('old')) {
					startBar();
				} else {
					progressTimeout = setTimeout(startBar, 150);
				}
			}
			if (!navigating) {
				if (progressTimeout) clearTimeout(progressTimeout);
				NProgress.done();
			}
		}
	});

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

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
		<link rel="canonical" href="https://whenplane.com{$page.url.pathname}" />
	{/if}
</svelte:head>

<Modal />
<ToastProvider />

{@render children?.()}
