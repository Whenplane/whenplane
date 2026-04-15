<script lang="ts">
	import Youtube from './svg/Youtube.svelte';
	import Twitch from './svg/Twitch.svelte';
	import Floatplane from './svg/Floatplane.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { timeString } from '$lib/timeUtils';
	import { getDateFormatLocale, getTimePreference } from '$lib/prefUtils.ts';
	import { typed } from '$lib';

	let { data = typed<any>() } = $props();

	// $: useTwitchFallback = (!data.isWdbResponseValid && (Date.now() - $wdbSocketState.lastReceive > 300e3));
	// $: if(useTwitchFallback) console.debug("Using twitch fallback:", data.isWdbResponseValid, $wdbSocketState.lastReceive);

	let nowish = $state(Date.now());

	let mounted = false;
	onMount(() => {
		mounted = true;
		let i = setInterval(() => {
			nowish = Date.now();
		}, 1e3);
		return () => clearInterval(i);
	});
</script>

<!--<WdbListener/>-->

<div class="logo-cloud grid-cols-1 md:grid-cols-3! gap-1" style="display: grid;">
	<a class="logo-item" href="https://www.twitch.tv/linustech" target="_blank" rel="noopener">
		<span>
			{#if page.url.searchParams.has('boca')}
				<img
					class="absolute z-0 rounded-lg"
					style="margin-left: 1px; height: 26px; width: 30px;"
					src="/secret/boca-cropped.jpg"
				/>
			{/if}
			<span class="inline-block relative z-10">
				<Twitch />
			</span>
		</span>
		<span>
			Twitch<br />
			<span class="status opacity-50" class:wan={data.liveStatus.twitch.isWAN}>
				{#if data.liveStatus.twitch.isLive}
					{#if data.liveStatus.twitch.isWAN}
						(live)
					{:else}
						(live non-WAN)
					{/if}
				{:else}
					(offline)
				{/if}
			</span>
		</span>
	</a>
	<a class="logo-item" href="/youtube-redirect" target="_blank">
		<span>
			{#if page.url.searchParams.has('boca')}
				<img
					class="absolute z-10 rounded-md opacity-50"
					style="margin-left: 6px; margin-top: 7px; height: 26px; width: 37px;"
					src="/secret/boca-cropped.jpg"
				/>
			{/if}
			<span class="inline-block relative z-0">
				<Youtube />
			</span>
		</span>
		<span>
			Youtube<br />
			<span
				class="status opacity-50"
				class:wan={data.liveStatus.youtube?.isWAN && data.liveStatus.youtube?.isLive}
				class:upcoming={data.liveStatus.youtube?.upcoming}
			>
				{#if data.liveStatus.youtube?.isLive}
					{#if data.liveStatus.youtube.isWAN}
						(live)
					{:else}
						(live non-WAN)
					{/if}
				{:else if data.liveStatus.youtube?.upcoming}
					{#if data.liveStatus.youtube.scheduledStart && new Date(data.liveStatus.youtube.scheduledStart).getTime() > nowish}
						{@const scheduled = new Date(data.liveStatus.youtube.scheduledStart)}
						(scheduled:
						<span
							class="inline-block min-w-[65px]"
							title="Scheduled for {scheduled.toLocaleDateString(getDateFormatLocale(), {
								dateStyle: 'medium'
							})}, {scheduled.toLocaleTimeString(undefined, {
								timeStyle: 'short',
								hour12: getTimePreference()
							})}"
						>
							{timeString(scheduled.getTime() - nowish)?.trim()})
						</span>
					{:else}
						(upcoming)
					{/if}
				{:else}
					(offline)
				{/if}
			</span>
		</span>
	</a>
	<a
		class="logo-item"
		href="https://www.floatplane.com/channel/linustechtips/live"
		target="_blank"
		rel="noopener"
	>
		<span>
			{#if page.url.searchParams.has('boca')}
				<img
					class="absolute z-0 rounded-full"
					style="margin-left: 2px; margin-top: 4px; height: 26px; width: 26px;"
					src="/secret/boca-cropped.jpg"
				/>
			{/if}
			<div class="inline-block relative z-10">
				<Floatplane />
			</div>
		</span>
		<span>
			Floatplane<br />
			<span
				class="status opacity-50"
				class:wan={data.liveStatus?.floatplane?.isWAN && data.liveStatus?.floatplane?.isLive}
				class:upcoming={data.liveStatus?.floatplane?.isThumbnailNew}
			>
				{#if data.liveStatus.floatplane?.isLive}
					{#if data.liveStatus?.floatplane?.isWAN}
						(live)
					{:else}
						(live non-WAN)
					{/if}
				{:else if data.liveStatus?.floatplane?.isThumbnailNew}
					(upcoming{data.liveStatus?.floatplane?.isWAN ? '' : ' non-wan'})
				{:else}
					(offline)
				{/if}
			</span>
		</span>
	</a>
</div>

<style>
	@reference "#app.css";
	.status {
		font-weight: normal;
		font-size: 0.9em;
	}

	.logo-cloud {
		justify-items: center;
		justify-content: center;
	}

	.logo-item {
		padding: 1.5em 2em;
		background-color: rgb(26, 28, 38);
		color: rgb(255, 255, 255);
		border-radius: 0.5rem;
		width: 100%;
		max-width: 300px;
		text-align: center;
	}
	.logo-item:hover {
		text-decoration: inherit;
		@apply brightness-125;
	}

	:global(.boca-theme) .logo-item {
		background-color: rgba(26, 28, 38, 0.6);
	}

	.wan {
		color: green;
	}

	.upcoming {
		color: yellow;
	}

	@media (pointer: coarse) {
		.fp-info {
			display: none;
		}
	}
</style>
