<!-- @migration task: review uses of `navigating` -->
<script lang="ts">
	import { typed } from '$lib';

	// Most of your app wide CSS should be put in this file
	import '../app.css';

	import 'nprogress/nprogress.css';
	import { navigating, page } from '$app/state';
	import NProgress from 'nprogress';
	import { browser, dev } from '$app/environment';
	import { setServiceWorker } from '$lib/stores.ts';
	import { onMount } from 'svelte';

	let { children = typed<import('svelte').Snippet>() } = $props();

	NProgress.configure({
		// Full list: https://github.com/rstacruz/nprogress#configuration
		minimum: 0.16
	});

	let progressTimeout: number;

	$effect(() => {
		if (browser) {
			if (navigating) {
				if (progressTimeout) clearTimeout(progressTimeout);
				const startBar = () => {
					if (navigating) {
						NProgress.start();
					}
				};
				const toURL = navigating.to?.url;
				if (toURL?.pathname == '/history' && toURL.searchParams.has('old')) {
					startBar();
				} else {
					progressTimeout = setTimeout(startBar, 150) as unknown as number;
				}
			}
			if (!navigating) {
				if (progressTimeout) clearTimeout(progressTimeout);
				NProgress.done();
			}
		}
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


{@render children?.()}
