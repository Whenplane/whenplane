<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import { popup } from '@skeletonlabs/skeleton';
	import { page } from '$app/state';

	import { getTimePreference } from '$lib/prefUtils';
	import { typed } from '$lib';

	let {
		border = typed<boolean>(true),
		tooltip = typed<boolean>(true),
		boca = typed<boolean>(page.url.searchParams.has('boca'))
	} = $props();

	run(() => {
		console.debug({ border });
	});

	let timeString = $state('');

	onMount(() => {
		let interval = setInterval(updateTimeString, 5e3);
		return () => clearInterval(interval);
	});

	function updateTimeString() {
		timeString = new Date().toLocaleTimeString(undefined, {
			timeZone: 'America/Vancouver',
			timeStyle: 'short',
			hour12: getTimePreference()
		});
	}
	updateTimeString();
</script>

<div
	class="ltttime background"
	class:border
	class:not-border={!border}
	use:popup={{
		event: 'hover',
		target: 'ltttime-info',
		placement: 'top'
	}}
>
	<span>
		{boca ? 'Boca' : 'LTT'} Time
	</span>
	<br />
	{timeString}
</div>
<div data-popup="ltttime-info" class="popup">
	{#if tooltip}
		<div class="card p-3 py-2 whitespace-nowrap shadow-x1 z-15 font-normal text-right">
			The current time in {boca ? 'Boca' : 'LTT'} land<br />
			(Vancouver)
		</div>
	{/if}
</div>

<style>
	.ltttime {
		text-align: center;
		padding: 0.2rem;

		font-size: 0.9em;
		line-height: 0.85em;
	}

	.ltttime.border {
		border-bottom: rgba(255, 255, 255, 0.2) solid 1px;
		border-left: rgba(255, 255, 255, 0.2) solid 1px;
		border-top: none;
		border-right: none;

		border-bottom-left-radius: 0.5rem;
	}
	.ltttime.not-border {
		border-radius: 2rem;
		padding-bottom: 1.2rem;
	}

	.popup {
		font-size: 1rem;
	}

	span {
		font-size: 0.82em;
		line-height: 0.5em;
	}

	.background {
		background-color: rgba(21, 23, 31, 0.8);
	}
</style>
