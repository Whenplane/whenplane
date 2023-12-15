<script lang="ts">
	import { getNextWAN, timeString } from "$lib/timeUtils";
	import ShowCountdown, {mainLate} from "$lib/ShowCountdown.svelte";
	import StreamStatus from "$lib/StreamStatus.svelte";
	import {invalidateAll} from "$app/navigation";
	import {onMount} from "svelte";
	import Late from "$lib/Late.svelte";
	import {page} from "$app/stores";
	import {fade} from "svelte/transition";
	import { browser, dev } from "$app/environment";
	import LatenessVoting from "$lib/LatenessVoting.svelte";
	import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
	import ImminentBox from "$lib/ImminentBox.svelte";
	import LTTTime from "$lib/LTTTime.svelte";
	import ExtensionAd from "$lib/ExtensionAd.svelte";

	export let data;

	let isAfterStartTime: boolean | undefined;
	let isLate: boolean | undefined;

	$: isLate = isAfterStartTime && !data.isPreShow && !data.isMainShow;

	$: isFrame = $page.url.searchParams.has("frame");


	let invalidationInterval: number | undefined;
	let lastInvalidation = Date.now();
	function invalidate() {
		// Only update in the background if there hasnt been an update for 30 minutes
		if(document.hidden && Date.now() - lastInvalidation < 30e3) {
			// console.debug("not updating", { hidden: document.hidden, distance: Date.now() - lastInvalidation });
			return;
		}
		// console.debug("updating")

		lastInvalidation = Date.now();
		invalidateAll();

		getDanGoingFor();

		nowish = new Date();
	}

	let nowish = new Date();

	let danGoingFor = "";
	function getDanGoingFor() {
		if(data.dan?.isLive) {
			const distance = Math.floor(Date.now() - new Date(data.dan.started).getTime());
			const string = timeString(distance);
			const parts = string.split(" ");
			if(parts.pop() == "") parts.pop(); // remove seconds
			danGoingFor = parts.join(" ");
		} else {
			danGoingFor = "";
		}
	}
	getDanGoingFor();

	// Periodically invalidate the data so that SvelteKit goes and fetches it again for us
	function startInvalidationInterval() {
		if(invalidationInterval) clearInterval(invalidationInterval);
		// VS code is getti87206ng the setInterval type from Node.js, so we need to override it
		invalidationInterval = setInterval(invalidate, 5e3) as unknown as number;
	}

	let mounted = false;
	onMount(() => {
		mounted = true;
		startInvalidationInterval();
		if(data.fast) setTimeout(invalidate, 500);
		console.debug({fast: data.fast});

		return () => {
			if (invalidationInterval) clearInterval(invalidationInterval)
		};
	})


	$: averageLateness = data.averageLateness ? timeString(Math.abs(data.averageLateness)) : undefined;
	$: medianLateness = data.medianLateness ? timeString(Math.abs(data.medianLateness)) : undefined;


	$: if(dev) console.log({data});


	// remove ?attempt after 500 error
	if(browser && $page.url.searchParams.has("attempt")) {
		window.history.replaceState({}, document.title, "/" + ($page.url.searchParams.has("frame") ? "?frame" : ""));
	}

	function onFocus() {
		// go ahead and invalidate if it's been a bit since the last one
		if(Date.now() - lastInvalidation > 5e3) {
			invalidate();
		}
	}


</script>
<svelte:window
		on:focus={onFocus}
/>
<svelte:head>
	<title>When is the WAN Show?  {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
	<meta name="description" content="Is the WAN show late? Yes. How late is the WAN show? Probably very! See a countdown to when WAN is supposed to start, as well as how late it's been before."/>
</svelte:head>

<div class="absolute top-0 right-0">
	<LTTTime/>
</div>

<div class="container h-full mx-auto justify-center items-center" class:alwaysFlex={isFrame}>
	<div class="space-y-5 inner">
		<ImminentBox hasDone={data.hasDone}/>
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
				{#if $mainLate.isMainLate && data.preShowStarted}
					<div class="text-center">
						The main show is late by
						<span class="mono">
							{$mainLate.string}
						</span>
					</div>
				{/if}

				{#if !isAfterStartTime}
					Next WAN:
					{#if mounted} <!-- dont SSR next wan date, as server timezone and locale is probably different than the users' -->
						<span in:fade={{duration: 150}}>
							{getNextWAN().toLocaleString()}
						</span>
					{/if}
				{:else if isLate}
					It usually <i>actually</i> starts between 1 and 3 hours late.
				{:else if data.isMainShow || data.isPreShow}
					{#if data.isPreShow}
						Pre-show started
					{:else}
						Started
					{/if}
					at
					{#if mounted}
						<span in:fade={{duration: 150}}>
							{new Date(data.mainShowStarted ?? data.preShowStarted).toLocaleTimeString()}
						</span>
					{/if}
				{/if}
			</div>
		</div>
		<div class="mx-4">
			<StreamStatus {data}/>
		</div>
		<div class="text-center">
			{#if averageLateness || dev}
				<span class="card px-4 py-2 mb-4 inline-block lateness">
					<h3>Average lateness</h3>
					<span class="opacity-75 text-90 relative bottom-1">from the last 5 shows</span>
					<br>
					{averageLateness} <Late/>
				</span>
			{/if}
			{#if medianLateness || dev}
				<span class="card px-4 py-2 mb-4 inline-block lateness">
					<h3>Median lateness</h3>
					<span class="opacity-75 text-90 relative bottom-1">from the last 5 shows</span>
					<br>
					{medianLateness} <Late/>
				</span>
			{/if}
			<br>
			{#if !isFrame}
				<a href="/history" class="btn variant-ghost-surface">
					History
				</a>
			{/if}
		</div>
		{#if data.dan?.isLive}
			<a class="card border-2 p-2 !border-amber-600 !bg-opacity-20 !bg-amber-600 block relative" href="https://twitch.tv/buhdan">
				<div class="absolute top-2 right-2 opacity-60">
					Live for {danGoingFor}
				</div>
				<img src="/dan.png" class="inline-block placeholder-circle h-32" alt="Dan">
				<div class="inline-flex h-32 items-center justify-center ml-4">
					<div>
						<h2>Dan is live!</h2>
						{data.dan.title}
					</div>
				</div>
			</a>
		{/if}
		{#if data.isThereWan?.text || data.isThereWan?.image}
			<div class="card border-2 p-2 !border-amber-600 !bg-opacity-20 !bg-amber-600 block text-center limit">
				{data.isThereWan?.text ?? ""}
				{#if data.isThereWan?.image || dev}
					<img src={data.isThereWan.image} alt={data.isThereWan?.text ?? ""} style="height: 10em;" class="mx-auto">
				{/if}
			</div>
		{/if}
		{#if (nowish.getUTCDay() === 5 || nowish.getUTCDay() === 6 || dev) && !data.hasDone && ($page.url.searchParams.has("showLatenessVoting") ? $page.url.searchParams.get("showLatenessVoting") === "true" : !isFrame)}
			<div>
				<Accordion>
					<AccordionItem open>
						<svelte:fragment slot="summary">
							<h3 class="inline">Lateness Voting</h3>
						</svelte:fragment>
						<svelte:fragment slot="content">
							<LatenessVoting {mainLate}/>
						</svelte:fragment>
					</AccordionItem>
				</Accordion>
			</div>
		{/if}
	</div>
</div>

{#if isFrame}
	<div class="absolute top-0 left-0 p-2">
		<span style="font-size: 0.8rem;">
			whenplane.com
		</span>
	</div>
{:else}
	<div class="absolute bottom-0 right-0 p-2">
		<a href="/about">About</a>
	</div>
{/if}

{#if !isFrame}
	<div class="absolute top-0 left-0">
		<ExtensionAd/>
	</div>
{/if}


{#if $page.url.hostname.includes("wheniswan.pages.dev")}
	<div class="fixed top-0 w-screen text-center">
		<div class="card inline-block p-2 mt-2">
			This site has a proper domain now!
			<br>
			<a href="https://whenplane.com">
				Consider using it
			</a>
			:)
		</div>
	</div>
{/if}

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

	.container {
		padding: 5em 1em 1em;
	}

	@media (max-height: 790px) {
		.inner:not(>.alwaysFlex) {
			padding-bottom: 5em;
		}
	}

	.alwaysFlex {
		display: flex;
		padding: 0;
	}
	
	@media (min-height: 790px) {
		.container {
			display: flex;
			padding: 0;
		}
	}

	.lateness {
		min-width: 18em;
	}
	
</style>
