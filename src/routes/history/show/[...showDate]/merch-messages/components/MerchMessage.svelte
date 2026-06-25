<script lang="ts">
	import type { MMV2TableRow } from '$lib/merch-messages/mm-types.ts';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import PersonX from 'svelte-bootstrap-icons/lib/PersonX.svelte';
	import ReplyFill from 'svelte-bootstrap-icons/lib/ReplyFill.svelte';
	import { page } from '$app/state';
	import { colonTimeString } from '$lib/timeUtils.ts';
	import floatplane from '$lib/svg/floatplane.svg?no-inline';
	import youtube from '$lib/svg/youtube.svg?no-inline';
	import { typed } from '$lib';

	let {
		message = typed<MMV2TableRow>(),
		youtubeId = typed<string | undefined>(),
		floatplaneId = typed<string | undefined>(),
		source = typed<'youtube' | 'floatplane' | 'floatplane-live'>(),
		preShowLength = typed<number | null>()
	} = $props();

	const seconds = Math.floor(message.timestamp);
	const imageUrl = `https://merch-message-images.whenplane.com/${message.show}/images/${seconds}.jpg`;

	const floatplaneSeconds = $derived(
		source.startsWith('floatplane')
			? source === 'floatplane-live'
				? seconds + 50
				: seconds
			: preShowLength !== null
				? seconds + Math.floor(preShowLength / 1e3)
				: null
	);
	const youtubeSeconds = $derived(
		source === 'youtube'
			? seconds
			: preShowLength !== null
				? (floatplaneSeconds ?? seconds) - Math.floor(preShowLength / 1e3) +
					((source === 'floatplane-live')
					? 250
					: 0)
				: null
	);
</script>

<div
	class="card card-hover relative p-4 my-3 mx-2 flex overflow-hidden text-left main-div"
	class:ml-6={message.type === 'reply'}
	class:bg-gray-950!={message.type === 'reply'}
	id={message.id}
	class:hashHighlight={page.url.hash === '#' + message.id}
>
	<div class="flex-1 grid grid-cols-[1fr_auto] items-center gap-y-2">
		<div class="flex items-center">
			{#if message.type === 'message'}
				<div aria-hidden="true">
					{#if message.name === 'Anonymous'}
						<figure class="avatar">
							<PersonX />
						</figure>
					{:else}
						<Avatar class="w-10 h-10">
							<Avatar.Fallback>{message.name.charAt(0)}</Avatar.Fallback>
						</Avatar>
					{/if}
				</div>
				 
				<span>{message.name}</span>
			{:else}
				<ReplyFill class="w-5 h-5 m-2" />
				 
				<div>
					<span class="opacity-80">Reply to</span>
					{message.name}
				</div>
			{/if}
		</div>

		<div class="opacity-70 ml-4 pr-4 col-span-2">
			{message.text}
		</div>

		<div class="row-start-1 col-start-2 justify-self-end md:pr-4 text-sm flex items-center gap-1">
			{#if floatplaneSeconds != null && floatplaneId}
				<a
					href="https://floatplane.com/post/{floatplaneId}?t={floatplaneSeconds}"
					rel="noopener"
					class="btn btn-sm preset-tonal-surface border border-surface-500 py-1 px-1.5"
					aria-label="Jump to message in Floatplane VOD"
				>
					<span
						class="inline-block bg-current mask-alpha -mr-0.5"
						style="height: 1.6em; width: 1.6em; mask: url({floatplane}) center / contain no-repeat;"
						aria-hidden="true"
					></span>
					{colonTimeString(floatplaneSeconds)}
				</a>
			{/if}
			{#if youtubeSeconds != null && youtubeSeconds >= 0}
				<a
					href="https://youtube.com/watch?v={youtubeId}&t={youtubeSeconds}"
					rel="noopener"
					class="btn btn-sm preset-tonal-surface border border-surface-500 py-1 px-1.5"
					aria-label="Jump to message in YouTube VOD"
				>
					<span
						class="inline-block bg-current mask-alpha -mr-1"
						style="height: 1.6em; width: 2em; mask: url({youtube}) center / contain no-repeat;"
						aria-hidden="true"
					></span>
					{colonTimeString(youtubeSeconds)}
				</a>
			{/if}
		</div>
	</div>
	<div class="w-full message-image shrink-0 self-center">
		<a href={imageUrl} aria-label="View Message Screenshot">
			{#key message}
				<img
					class="w-full"
					src={imageUrl}
					width="1000"
					height="200"
					loading="lazy"
					alt=""
					aria-hidden="true"
				/>
			{/key}
		</a>
	</div>
</div>

<style>
	@reference "#app.css";

	figure.avatar {
		@apply w-10 bg-surface-500 rounded-full flex aspect-square text-surface-50 font-semibold justify-center items-center overflow-hidden isolate;
	}

	.message-image {
		@apply mt-2;
	}
	.main-div {
		flex-direction: column;
	}
	@media (width >= 48rem) {
		.message-image {
			width: 28rem;
			margin: 0;
		}
		.main-div {
			flex-direction: row;
		}
	}

	.hashHighlight {
		border: #d4163c 2px solid;
		border-radius: 12px;
	}
</style>
