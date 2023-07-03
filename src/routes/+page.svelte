<script lang="ts">
	import {getNextWAN} from "$lib/timeUtils";
	import ShowCountdown, {mainLate} from "$lib/ShowCountdown.svelte";
	import StreamStatus from "$lib/StreamStatus.svelte";
	import {browser} from "$app/environment";
	import {invalidateAll} from "$app/navigation";
	import {onMount} from "svelte";
	import Late from "../lib/Late.svelte";
	import type {Writable} from "svelte/store";

	export let data;

	let isAfterStartTime: boolean | undefined;
	let isLate: boolean | undefined;

	$: isLate = isAfterStartTime && !data.isPreShow && !data.isMainShow;

	(mainLate as Writable<never>).subscribe((v) => {
		console.log(v);
	});


	let invalidationInterval: number | undefined;
	let lastInvalidation = Date.now();
	function invalidate() {
		console.log("invalidated")
		lastInvalidation = Date.now();
		invalidateAll();
	}

	// Periodically invalidate the data so that SvelteKit goes and fetches it again for us
	function startInvalidationInterval() {
		if(invalidationInterval) clearInterval(invalidationInterval);
		// VS code is getting the setInterval type from NodeJS, so we need to override it
		invalidationInterval = setInterval(invalidate, 5e3) as unknown as number;

		// go ahead and invalidate if it's been a bit since the last one
		if(Date.now() - lastInvalidation > 5e3) {
			invalidate();
		}
	}

	onMount(() => {
		startInvalidationInterval();
		if(data.fast) setTimeout(invalidate, 500);
		console.log({fast: data.fast})

		return () => {
			if (invalidationInterval) clearInterval(invalidationInterval)
		};
	})


</script>
<svelte:window
		on:focus={startInvalidationInterval}
		on:blur={() => clearInterval(invalidationInterval)}
/>
<svelte:head>
	<title>When is WAN?</title>
</svelte:head>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<div class="text-center">
			<div class="card p-4 inline-block countdown-box text-left">
				{#if isLate}
					The WAN show is currently <span class="red"><Late/></span> by
				{:else if data.mainShowStarted}
					The WAN show has been live for
				{:else if data.preShowStarted}
					The pre-WAN show has been live for
				{:else}
					The WAN show is (supposed) to start in
				{/if}

				<h1 class="text-center" class:red={isLate}>
					<ShowCountdown bind:isAfterStartTime={isAfterStartTime} {data}/>
				</h1>
				{#if $mainLate.isMainLate}
					<div class="text-center">
						The main show is late by
						<span class="mono">
							{$mainLate.string}
						</span>
					</div>
				{/if}

				{#if !isAfterStartTime}
					Next WAN:
					{#if browser} <!-- dont SSR next wan date, as server timezone and locale is probably different than the users' -->
						{getNextWAN().toLocaleString()}
					{/if}
				{:else if isLate}
					It usually <i>actually</i> starts between 1 and 2 hours late.
				{:else if data.isMainShow || data.isPreShow}
					{#if data.isPreShow}
						Pre-show started
					{:else}
						Started
					{/if}
					at
					{#if browser}
						{new Date(data.mainShowStarted ?? data.preShowStarted).toLocaleTimeString()}
					{/if}
				{/if}
			</div>
		</div>
		<div class="mx-4">
			<StreamStatus {data}/>
		</div>
		<div class="text-center">
			<a href="/history" class="btn variant-ghost-surface">
				History
			</a>
		</div>
	</div>
</div>
<div class="absolute bottom-0 right-0 p-2">
	<a href="/about">About</a>
</div>

<style>
	.countdown-box {
		min-width: 23em;
		margin-left: auto;
	}
	.red {
		color: red;
	}
	.mono {
		font-family: monospace;
	}
</style>
