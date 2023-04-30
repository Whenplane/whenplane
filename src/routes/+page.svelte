<script>
	import {getNextWAN} from "../lib/timeUtils";
	import Twitch from "../lib/Twitch.svelte";
	import Youtube from "../lib/Youtube.svelte";
	import ShowCountdown from "../lib/ShowCountdown.svelte";
	import StreamStatus from "../lib/StreamStatus.svelte";
	import {browser} from "$app/environment";
</script>

<!-- YOU CAN DELETE EVERYTHING IN THIS PAGE -->

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<div class="text-center">
			<div class="card p-4 inline-block countdown-box text-left">
				The WAN show is (supposed) to start in
				<h1 class="text-center"><ShowCountdown/></h1>
				Next WAN:
				{#if browser} <!-- dont SSR next wan date, as server timezone and locale is probably different than the users' -->
					{getNextWAN().toLocaleString()}
				{/if}
			</div>
		</div>
		<StreamStatus/>
	</div>
</div>

<style>
	.countdown-box {
		min-width: 23em;
		margin-left: auto;
	}
</style>
