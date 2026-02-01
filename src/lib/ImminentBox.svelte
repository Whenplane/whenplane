<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import Info from '$lib/svg/Info.svelte';
	import { removeAfterLastDash } from '$lib/utils';
	import type { FpEndpointResponse } from '../routes/api/(live-statuses)/floatplane/+server.ts';
	import { timeString } from '$lib/timeUtils.ts';
	import { slide } from 'svelte/transition';
	import { typed } from '$lib';

	let {
		floatplane = typed<FpEndpointResponse | undefined>(),
		hasDone = typed<boolean>(false)
	} = $props();

	// the thumbnail age cutoff where the thumbnail wont be shown at all. currently 3 hours
	const ageCutoff = 24 * 60 * 60e3;

	const day = new Date().getUTCDay();
	const dayIsCloseEnough = day === 5 || day === 6;
	// $: console.log("imminentbox show: ", (!hasDone) + " && " + (!$floatplaneState?.live) +" && "+ "((" +dayIsCloseEnough +" && "+ ($floatplaneState?.imminence) +" === 3)"+ /*|| dev*/")")
</script>

{#if floatplane && !floatplane?.isLive && floatplane?.isWAN && dayIsCloseEnough && (floatplane?.isThumbnailNew || floatplane?.thumbnailAge < ageCutoff) && !hasDone /*|| dev*/}
	<div
		class="card border-2 p-2 !border-green-600 !bg-opacity-20 !bg-green-600 block relative pb-0 mobile-add-padding"
		transition:slide={{ duration: 1.5e3 }}
	>
		<a href={floatplane?.thumbnail} target="_blank" rel="noopener">
			<img
				src={floatplane?.thumbnail}
				class="inline-block h-32 rounded-lg mobile-full-width"
				alt="Dan"
			/>
		</a>
		<div class="inline-flex h-32 items-center justify-center ml-4 mobile-full-width">
			<div>
				{#if floatplane?.isThumbnailNew}
					<h2 class="!mb-0">The show might start soon!</h2>
				{/if}
				The thumbnail was updated{floatplane?.isThumbnailNew ? '' : ','}
				{#if !floatplane?.isThumbnailNew}
					but they haven't gone live yet.<br />
					It was updated
				{/if}
				{timeString(floatplane?.thumbnailAge, true, false)} ago
				<div
					class="text-surface inline-block info [&>*]:pointer-events-none"
					use:popup={{
						event: 'hover',
						target: 'imminent-thumbnail',
						placement: 'bottom'
					}}
				>
					<Info />
				</div>
			</div>
		</div>
	</div>
{/if}

<div
	class="card p-4 whitespace-nowrap shadow-x1 z-10 font-normal"
	data-popup="imminent-thumbnail"
	style="margin-top: 0;"
>
	Generally when a thumbnail is uploaded, all hosts are in their seats ready to start the show.
	<br/>
	Usually the pre-show starts within 10 minutes of a thumbnail being uploaded.
</div>

<style>
	@media (max-width: 600px) {
		.mobile-full-width {
			height: initial !important;
			width: 100%;
			margin-left: 0;
		}
		.mobile-add-padding {
			padding-bottom: 1em;
		}
	}

	@media (pointer: coarse) {
		.info {
			display: none;
		}
	}
</style>
