<script lang="ts">
	import { run } from 'svelte/legacy';

	import { addZero } from './timeUtils';

	let { value = $bindable<number>(300) } = $props();

	let hours = $state(addZero(Math.floor(value / (60 * 60))));
	let minutes = $state(addZero(Math.floor((value % (60 * 60)) / 60)));
	let seconds = $state(addZero(Math.floor(value % 60)));

	run(() => {
		value = (Number(hours) * 60 * 60) + (Number(minutes) * 60) + Number(seconds)
	});
</script>

<div class="inline-block">
	<div class="input-group grid-cols-[auto_4px_auto_4px_auto] text-center px-1">
		<input type="number" class="text-right" bind:value={hours} />
		<div class="!p-0 mb-1">:</div>
		<input type="number" class="text-center" bind:value={minutes} />
		<div class="!p-0 mb-1">:</div>
		<input type="number" class="text-left" bind:value={seconds} />
	</div>
</div>

<style>
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		/* display: none; <- Crashes Chrome on hover */
		-webkit-appearance: none;
		margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
	}

	input[type='number'] {
		-moz-appearance: textfield; /* Firefox */

		width: 1.5em;

		padding-left: 0.1em;
		padding-right: 0.1em;
	}

	.input-group {
		width: calc((3 * 1.5em) + (3 * 4px) + 0.5rem);
	}
</style>
