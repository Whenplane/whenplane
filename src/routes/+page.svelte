<script lang="ts">
	import { getNextWAN, isNearWan, timeString } from "$lib/timeUtils";
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
	import SpecialStream from "$lib/SpecialStream.svelte";
	import NewsAnnouncer from "$lib/NewsAnnouncer.svelte";
	import sanitizeHtml from "sanitize-html";
	import { newsSanitizeSettings } from "$lib/news/news.ts";
	import ToolTip from "$lib/ToolTip.svelte";
	import AdPicker from "$lib/ads/AdPicker.svelte";
	import NotablePersonLive from "$lib/NotablePersonLive.svelte";
	import { getCookie } from "$lib/cookieUtils.ts";
	import Socket from "$lib/Socket.svelte";
	import CaretDownFill from "svelte-bootstrap-icons/lib/CaretDownFill.svelte";
	import {popup} from "@skeletonlabs/skeleton";
	import { getDateFormatLocale, getTimePreference } from "$lib/prefUtils.ts";

	export let data;

	let isAfterStartTime: boolean | undefined;
	let isLate: boolean | undefined;

	$: isLate = isAfterStartTime && !data.isPreShow && !data.isMainShow;

	$: isFrame = $page.url.searchParams.has("frame");

	const myDomains = [
		"whenplane.com",
		"whenwan.show",
		"whenplane.pages.dev",
		"when.show",
		"localhost"
	]

	const reloadNumber = data.liveStatus?.reloadNumber;
	$: {
		if(data.liveStatus && data.liveStatus?.reloadNumber != reloadNumber) {
			location.href = "";
		}
	}

	let outerContainer: HTMLDivElement;
	let mainContainer: HTMLDivElement;


	let invalidationInterval: number | undefined;
	let lastInvalidation = Date.now();

	let i = 0;
	function invalidate() {
		// Only update in the background if there hasnt been an update for 30 minutes
		if(document.hidden && Date.now() - lastInvalidation < 30 * 60e3) {
			// console.debug("not updating", { hidden: document.hidden, distance: Date.now() - lastInvalidation });
			return;
		}
		const day = new Date().getUTCDay();


		const isAwayFromWan = day < 5 || (data.hasDone && !(data.liveStatus?.twitch?.isWAN && data.liveStatus?.twitch?.isLive))
		// update less often when far away from wan time (but bypass if last update was more than a minute ago)
		if(isAwayFromWan && i++ % 6 === 0 && Date.now() - lastInvalidation < 60e3) {
			return;
		}

		// When using a websocket (and is online), don't do a full update more than once every 5 minutes
		if(data.useWebSocket && data.liveStatus && Date.now() - lastInvalidation < 5 * 60e3) {
			return;
		}

		lastInvalidation = Date.now();
		invalidateAll();

		nowish = new Date();
	}

	let nowish = new Date();

	// Periodically invalidate the data so that SvelteKit goes and fetches it again for us
	function startInvalidationInterval() {
		if(invalidationInterval) clearInterval(invalidationInterval);
		// VS code is getting the setInterval type from Node.js, so we need to override it
		invalidationInterval = setInterval(invalidate, data.useWebSocket ? 30e3 : 5e3) as unknown as number;
	}

	let mounted = false;
	onMount(() => {
		mounted = true;
		startInvalidationInterval();
		if(data.fast) setTimeout(invalidate, 500);
		console.debug({fast: data.fast});
		checkHeight();

		let chi = setInterval(checkHeight, 1e3);

		return () => {
			if (invalidationInterval) clearInterval(invalidationInterval)
			clearInterval(chi)
		};
	})

	if(browser) checkHeight();


	$: averageLateness = data.averageLateness ? timeString(Math.abs(data.averageLateness)) : undefined;
	$: latenessStandardDeviation = data.latenessStandardDeviation ? timeString(Math.abs(data.latenessStandardDeviation)) : undefined;
	$: medianLateness = data.medianLateness ? timeString(Math.abs(data.medianLateness)) : undefined;


	$: if(dev) console.log({data});


	// remove ?attempt after 500 error
	if(browser && $page.url.searchParams.has("attempt")) {
		const newURL = new URL(location.href);
		newURL.searchParams.delete("attempt");
		window.history.replaceState({}, document.title, "/" + (newURL.searchParams.size > 0 ? "?" + newURL.searchParams.toString() : ""));
	}

	let addSpace = false;
	function checkHeight() {
		if(!browser || !mainContainer) return;
		if(mainContainer.scrollHeight > window.innerHeight-50) {
			outerContainer.classList.remove("items-center")
			outerContainer.classList.add("too-short")
			addSpace = true // So that there is some space at the bottom when scrolling. for some stupid reason padding doesnt work here
			if(dev) console.debug("too short")
		} else {
			outerContainer.classList.add("items-center")
			outerContainer.classList.remove("too-short")
			addSpace = false
		}
	}

	function onFocus() {
		// go ahead and invalidate if it's been a bit since the last one
		if(Date.now() - lastInvalidation > 5e3) {
			invalidate();
		}
	}

	const disableNotableStreams = browser ? !(getCookie("disableNotableStreams") !== "true") : !($page.params.__c__disableNotableStreams !== "true");

	const description = "Is The WAN Show late? Yes. How late is The WAN Show? Probably very! See a countdown to when WAN is supposed to start, as well as how late it's been before.";

</script>
<svelte:window
		on:focus={onFocus}
		on:visibilitychange={onFocus}
/>
<svelte:head>
	<title>When is the WAN Show?  {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
	<meta name="description" content={description}/>
	<link rel="canonical" href="https://whenplane.com/"/>
</svelte:head>

{#if data.useWebSocket}
	<Socket events={["aggregate"]} autoInvalidateAfterNoData={true}/>
{/if}

<div class="absolute top-0 right-0">
	{#if !isFrame}
		<a class="hidden-link" href="/ltt-time">
			<LTTTime/>
		</a>
	{:else}
		<LTTTime/>
	{/if}
</div>

{#if !isFrame}
	<NewsAnnouncer/>

	<span class="clear inline-block absolute pointer-events-none" style="z-index: -5;">
		{description}
		When is wan? Who is wan? Why is wan? Who knows!
		When is WAN show? The WAN show is <i>supposed</i> to start at 4:30 PM PST.
		Despite the scheduled start time, the show is almost always between 1 and 3 hours late.
		This time is also known as "Linus Standard Time". Thanks, LTT.
	</span>
{/if}

<div class="container h-full mx-auto justify-center items-center" bind:this={outerContainer} class:alwaysFlex={isFrame}>
	<div class="space-y-3 inner" bind:this={mainContainer}>
		{#if !$page.data.isBot} <!-- so the imminent box stops showing up in search results -->
			<ImminentBox floatplane={data.liveStatus?.floatplane} hasDone={data.hasDone}/>
		{/if}
		<div class="text-center">
			{#if data.specialStream && !$page.data.isBot}
				{#key data.specialStream}
					<SpecialStream {data}/>
				{/key}
			{/if}
			<div class="card p-4 whitespace-nowrap shadow-x1 z-10 font-normal" data-popup="estimated-special-stream-start" style="margin-top: 0;">
				Often, LTT does not announce streams, they just go live.<br>
				So the only way we know that a stream is happening is when they upload a title, description, and thumbnail.<br>
				This usually happens a few hours before the stream starts, and a guess is made at the start time.<br>
				It will be updated if there is any official word.<br>
				If something was announced or you have info, please contact me. My contact details are on the about page.
			</div>
			<br>
			<div class="card p-4 inline-block countdown-box text-left">
				{#if isLate}
					The WAN show is currently <span class="red"><Late/></span> by
				{:else if data.isMainShow}
					The WAN show has been live for
				{:else if data.liveStatus?.floatplane?.isLive && data.liveStatus?.floatplane?.isWAN && !data.liveStatus.twitch?.isLive}
					The pre-pre-WAN show has been live for
				{:else if data.isPreShow}
					The pre-WAN show has been live for
				{:else}
					The WAN show is (supposed) to start in
				{/if}

				<h1 class="text-center no-header-margin" class:red={isLate}>
					{#if data.isMainShow && !data.mainShowStarted}
						????
						<div style="font-size: 0.25em;" class="pb-2">
							If you see this, youtube messed up again
						</div>
					{:else if data.isPreShow && !data.preShowStarted}
						{#if data.liveStatus?.floatplane?.isLive && data.liveStatus?.floatplane?.isWAN && !data.liveStatus?.twitch?.isLive}
							<ShowCountdown bind:isAfterStartTime={isAfterStartTime} {data}/>
						{:else}
							????
							<div style="font-size: 0.25em;" class="pb-2">
								If you see this, twitch is probably messing up
							</div>
						{/if}
					{:else}
						<ShowCountdown bind:isAfterStartTime={isAfterStartTime} {data}/>
					{/if}
				</h1>
				{#if $mainLate.isMainLate && data.isPreShow}
					<div class="text-center">
						The main show is {$mainLate.late ? "late" : "early"} by
						<span class="mono">
							{$mainLate.string}
						</span>
					</div>
				{/if}

				{#if !isAfterStartTime && !data.isMainShow}
					Next WAN:
					{#if mounted} <!-- dont SSR next wan date, as server timezone and locale is probably different than the users' -->
						<span in:fade|global={{duration: 150}}>
							<!--{getNextWAN().toLocaleString()}-->
							{getNextWAN().toLocaleDateString(getDateFormatLocale())}
							{getNextWAN().toLocaleTimeString(undefined, {hour12: getTimePreference()})}
						</span>
					{/if}
				{:else if isLate}
					It usually <i>actually</i> starts between 1 and 3 hours late.
				{:else if (data.isMainShow && data.mainShowStarted) || data.isPreShow}
					{#if data.isPreShow && data.liveStatus?.twitch.isLive}
						Pre-show started
					{:else if data.isPreShow && data.liveStatus?.floatplane?.isLive}
						Pre-pre-show started
					{:else}
						Started
					{/if}
					at
					{#if mounted}
						<span in:fade|global={{duration: 150}}>
							{new Date(data.mainShowStarted ?? data.preShowStarted ?? data.liveStatus.floatplane.started).toLocaleTimeString(undefined, {hour12: getTimePreference()})}
						</span>
					{/if}
				{/if}
			</div>
		</div>


		<div class="mx-4">
			{#if data.liveStatus}
				<StreamStatus {data}/>
			{:else}
				<span class="opacity-75">
					Live stream status not available while offline.
				</span>
			{/if}
		</div>


		<div class="text-center lateness-stats">
			{#if averageLateness || dev}
				<span class="card px-4 py-2 mb-4 inline-block lateness">
					<h3 class="no-header-margin">Average lateness</h3>
					<span class="opacity-75 text-90 relative bottom-1">from the last 5 shows</span>
					<br>
					{averageLateness} <Late/>
					{#if latenessStandardDeviation}
						<br>
						<span class="smaller">
							&plusmn; {latenessStandardDeviation}
						</span>
						<ToolTip id="stdDev">
							Think of standard deviation as a measure that tells you how much individual values in a set typically differ from the average of that set. If the standard deviation is small, it means most values are close to the average. If it's large, it means values are more spread out from the average, indicating greater variability in the data. Essentially, standard deviation gives you an idea of how consistent or varied the values are in relation to the average.
						</ToolTip>
					{/if}
				</span>
			{/if}
			{#if medianLateness || dev}
				<span class="card px-4 py-2 mb-4 inline-block lateness">
					<h3 class="no-header-margin">Median lateness</h3>
					<span class="opacity-75 text-90 relative bottom-1">from the last 5 shows</span>
					<br>
					{medianLateness} <Late/>
					{#if latenessStandardDeviation}
						<br>
						<span class="smaller">
							&nbsp;
						</span>
					{/if}
				</span>
			{/if}
			<br>
			{#if !isFrame}
				<a href="/history" class="btn variant-ghost-surface">
					History
				</a>
				<button class="btn variant-ghost-surface" use:popup={{
					event: 'click',
					target: 'moreDropdown',
					placement: 'bottom'
				}}>
					<span class="capitalize">More</span>
					<span><CaretDownFill/></span>
				</button>
				<div class="card w-48 !shadow-2xl overflow-hidden z-20" data-popup="moreDropdown">
					<a class="btn variant-filled-surface rounded-none w-full" href="/search">
						WAN Show Search
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/notifications">
						Push Notifications
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/merch-messages">
						Merch Messages Index
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/extension">
						Whenplane Extension
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/lttstore">
						LTTStore Watcher
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/floatplane">
						Floatplane Watcher
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/news">
						Whenplane News
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/about">
						About & Preferences
					</a>
					<a class="btn variant-filled-surface rounded-none w-full" href="/discord" data-sveltekit-reload>
						Whenplane Discord
					</a>


					<div class="arrow bg-surface-400-500-token" />
				</div>
				<br>
				<br>
			{/if}
			<!--{#if nowish.getTime() < 1710572400000}
				<a href="https://www.twitch.tv/bocabola" target="_blank" rel="noopener" class="!no-underline">
					Elijah (BocaBola) will be streaming during After Dark and after WAN Show!
				</a>
			{/if}-->
		</div>


		{#if (data.isThereWan?.text || data.isThereWan?.image) && !data.isBot}
			<div class="card border-2 p-2 !border-amber-600 !bg-opacity-20 !bg-amber-600 block text-center limit mx-auto">
				{#if data.isThereWan?.text}
					{@html sanitizeHtml(data.isThereWan?.text, newsSanitizeSettings)}
				{/if}
				{#if data.isThereWan?.image}
					<img src={data.isThereWan.image} alt={sanitizeHtml(data.isThereWan?.text ?? "", {allowedTags: []})} style="max-height: 10em;" class="mx-auto">
				{/if}
			</div>
		{/if}

		{#if (data.notablePeople && !disableNotableStreams) && !data.isBot}
			{#each Object.values(data.notablePeople) as shortResponse}
				{#if (typeof shortResponse === "object") && shortResponse.isLive}
					<NotablePersonLive {shortResponse}/>
				{/if}
			{/each}
			{#if Object.values(data.notablePeople).some(p => p.isLive)}
				<div class="text-center pb-5">
					Do <b>not</b> share other streams in any LTT chat (like wan chat)
				</div>
			{/if}
		{/if}

		<!--<NotablePersonLive shortResponse={{
			isLive: true,
			name: "Elijah",
			title: "(stream title will be here)",
			channel: "bocabola",
			started: "2024-02-08T22:45:02.407Z"
		}}/>-->

		{#if !$page.data.isBot && (nowish.getUTCDay() === 5 || nowish.getUTCDay() === 6 /*|| dev*/) && !data.hasDone && ($page.url.searchParams.has("showLatenessVoting") ? $page.url.searchParams.get("showLatenessVoting") === "true" : !isFrame)}
			<div>
				<Accordion padding="pb-2 px-4">
					<AccordionItem open>
						<svelte:fragment slot="summary">
							<h3 class="inline">Lateness Voting</h3>
						</svelte:fragment>
						<svelte:fragment slot="content">
							{#if data.liveStatus}
								<LatenessVoting {mainLate}/>
							{:else}
								<span class="opacity-75">Lateness voting not available while offline.</span>
							{/if}
						</svelte:fragment>
					</AccordionItem>
				</Accordion>
			</div>
		{/if}
		{#if addSpace}
			<div class="h-16"></div>
		{/if}
	</div>
</div>

{#if isFrame}
	<div class="absolute top-0 left-0 p-2">
		<span style="font-size: 0.75rem;">
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
		<AdPicker/>
	</div>
{/if}


{#if $page.url.hostname.includes("wheniswan.pages.dev")}
	<div class="fixed bottom-0 w-screen text-center">
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

{#if !myDomains.includes($page.url.hostname.replaceAll("www.", "")) && !$page.url.hostname.endsWith("wheniswan.pages.dev")}
	<div class="fixed top-0 w-screen text-center">
		<div class="card inline-block p-2 mt-2 px-3" style="font-size: 0.75em; background-color: rgba(21, 23, 31, 0.3) !important;">
			You are using an unofficial domain. Whenplane cannot guarantee that this domain doesnt modify the site in any way.
			<br>
			<a href="https://whenplane.com">
				Use the official domain here
			</a>
		</div>
	</div>
{/if}

<style>
	.countdown-box {
		min-width: 23em;
		margin-left: auto;
	}

	:global(.boca-theme) .countdown-box {
		background-color: rgba(26, 28, 38, 0.6)
	}

	.red {
		color: red;
	}
	.mono {
		font-family: monospace;
	}

	.container {
		padding: 5em 1em 1em;
		transition: padding 0.4s;
	}

	.lateness-stats {
		font-size: 0.9em;
	}

	@media (max-height: 790px) {
		.inner:not(>.alwaysFlex) {
			padding-bottom: 5em;
		}
	}

	.alwaysFlex:not(.too-short) {
		padding: 0;
	}
	.alwaysFlex {
		display: flex;
	}
	
	@media (min-height: 790px) {
		.container:not(.too-short) {
			padding: 0;
		}
		.container {
			display: flex;
		}
	}

	.lateness {
		min-width: 18em;
	}

	:global(.boca-theme) .lateness {
		background-color: rgba(26, 28, 38, 0.6);
	}

	.smaller {
		font-size: 0.9em;
	}
	
</style>
