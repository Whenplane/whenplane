<script>
	import {getNextWAN} from "$lib/timeUtils";
	import ShowCountdown from "$lib/ShowCountdown.svelte";
	import StreamStatus from "$lib/StreamStatus.svelte";
	import {browser} from "$app/environment";
	import {invalidateAll} from "$app/navigation";

	export let data;

	let isAfterStartTime;
	let isLate;

	$: isLate = isAfterStartTime && !data.isPreShow && !data.isMainShow;

	// Periodically invalidate the data so that sveltekit goes and fetches it again for us
	let invalidationInterval;
	let lastInvalidation = Date.now();
	function invalidate() {
		lastInvalidation = Date.now();
		invalidateAll();
	}

	function startInvalidationInterval() {
		clearInterval(invalidationInterval);
		invalidationInterval = setInterval(invalidate, 5e3);

		// go ahead and invalidate if it's been a bit since the last one
		if(Date.now() - lastInvalidation > 5e3) {
			invalidate();
		}


	}

	if(browser) startInvalidationInterval();

</script>
<svelte:window
		on:focus={startInvalidationInterval}
		on:blur={() => clearInterval(invalidationInterval)}
/>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<div class="text-center">
			<div class="card p-4 inline-block countdown-box text-left">
				{#if isLate}
					The WAN show is currently <span class="red">late</span> by

				{:else if data.mainShowStarted}
					The WAN show has been live for
				{:else if data.preShowStarted}
					The pre-WAN show has been live for
				{:else}
					The WAN show is (supposed) to start in
				{/if}
				<h1 class="text-center" class:red={isLate}>
					<ShowCountdown bind:isLate={isAfterStartTime} {data}/>
				</h1>
				{#if !isAfterStartTime}
					Next WAN:
					{#if browser} <!-- dont SSR next wan date, as server timezone and locale is probably different than the users' -->
						{getNextWAN().toLocaleString()}
					{/if}
				{:else if isLate}
					It usually <i>actually</i> starts around 1.5 to 2 hours late
				{/if}
			</div>
		</div>
		<div class="mx-4">
			<StreamStatus {data}/>
		</div>
	</div>
</div>

<style>
	.countdown-box {
		min-width: 23em;
		margin-left: auto;
	}
	.red {
		color: red;
	}
</style>
