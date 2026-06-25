<script lang="ts">
	import type { MMV2CondensedTableRow, MMV2TableRow } from "$lib/merch-messages/mm-types.ts";
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import ReplyFill from 'svelte-bootstrap-icons/lib/ReplyFill.svelte';
	import { page } from '$app/state';
	import { colonTimeString } from '$lib/timeUtils.ts';
	import { typed } from '$lib';

	let {
		message = typed<MMV2CondensedTableRow>(),
		show = typed<string>(),
		youtubeId = typed<string | undefined>(),
		floatplaneId = typed<string | undefined>(),
		source = typed<'youtube' | 'floatplane' | 'floatplane-live'>(),
		preShowLength = typed<number | null>()
	} = $props();

	const seconds = $derived(Math.floor(message.timestamp));
	const imageUrl = $derived(`https://merch-message-images.whenplane.com/${show}/images/${seconds}.jpg`);

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
	class="mm-card"
	class:reply={message.type === 'r'}
	id={message.id ?? `${show}-${seconds}`}
	class:hashHighlight={page.url.hash === '#' + message.id}
>
	<div class="mm-text">
		<div>
			{#if message.type === 'm'}
				<div aria-hidden="true">
					{#if message.name === 'Anonymous'}
						<figure>
							<span class="px"></span>
						</figure>
					{:else}
						<Avatar class="size-10">
							<Avatar.Fallback>{message.name.charAt(0)}</Avatar.Fallback>
						</Avatar>
					{/if}
				</div>
				 
				<span>{message.name}</span>
			{:else}
				<ReplyFill class="size-5 m-2" />
				 
				<div>
					<span class="op-8">Reply to</span>
					{message.name}
				</div>
			{/if}
		</div>

		<div>
			{message.text}
		</div>

		<div class="mm-links">
			{#if floatplaneSeconds != null && floatplaneId}
				<a
					href="https://floatplane.com/post/{floatplaneId}?t={floatplaneSeconds}"
					rel="noopener"
					aria-label="Jump to message in Floatplane VOD"
				>
					<span class="fp" aria-hidden="true"></span>
					{colonTimeString(floatplaneSeconds)}
				</a>
			{/if}
			{#if youtubeSeconds != null && youtubeSeconds >= 0}
				<a
					href="https://youtu.be/{youtubeId}?t={youtubeSeconds}"
					rel="noopener"
					aria-label="Jump to message in YouTube VOD"
				>
					<span class="yt" aria-hidden="true"></span>
					{colonTimeString(youtubeSeconds)}
				</a>
			{/if}
		</div>
	</div>
	<div class="mm-img">
		<a href={imageUrl} aria-label="View Message Screenshot">
			{#key message}
				<img
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

	.reply {
		@apply ml-6! bg-gray-950!;
	}

	.mm-card {
		@apply card card-hover relative p-4 my-3 mx-2 flex flex-col overflow-hidden text-left;
	}

	.mm-text {
		@apply flex-1 grid grid-cols-[1fr_auto] items-center gap-y-2;
	}

	.mm-text > :nth-child(1) {
		@apply flex items-center;
	}

	.mm-text > :nth-child(2) {
		@apply opacity-70 ml-4 pr-4 col-span-2;
	}


	.mm-links {
		@apply row-start-1 col-start-2 justify-self-end md:pr-4 text-sm flex items-center gap-1;
	}

	.mm-links > a {
		@apply btn btn-sm preset-tonal-surface border border-surface-500 py-1 px-1.5;
	}

	.mm-links > a > span {
		@apply inline-block bg-current mask-alpha -mr-0.5;
	}

	.px {
		background-color: currentColor;
		height: 1.25em;
		width: 1.25em;
		mask: var(--pxi) center / contain no-repeat;
	}

	.fp {
		height: 1.6em;
		width: 1.6em;
		mask: var(--fpi) center / contain no-repeat;
	}
	.yt {
		height: 1.6em;
		width: 2em;
		mask: var(--yti) center / contain no-repeat;
	}

	.op-8 {
		@apply opacity-80;
	}

	.mm-img {
		@apply w-full mt-2 shrink-0 self-center;
	}

	img {
		@apply w-full;
	}

	figure {
		@apply w-10 bg-surface-500 rounded-full flex aspect-square text-surface-50 font-semibold justify-center items-center overflow-hidden isolate;
	}

	@media (width >= 48rem) {
		.mm-img {
			width: 28rem;
			margin: 0;
		}
		.mm-card {
			@apply flex-row;
		}
	}

	.hashHighlight {
		border: #d4163c 2px solid;
		border-radius: 12px;
	}
</style>
