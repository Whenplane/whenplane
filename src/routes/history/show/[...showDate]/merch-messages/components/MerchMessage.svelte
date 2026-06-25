<script lang="ts">
	import type { MMV2CondensedTableRow } from "$lib/merch-messages/mm-types.ts";
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/state';
	import { colonTimeString } from '$lib/timeUtils.ts';
	import { typed } from '$lib';
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";

	let {
		message = typed<MMV2CondensedTableRow>(),
		show = typed<string>(),
		youtubeId = typed<string | undefined>(),
		floatplaneId = typed<string | undefined>(),
		source = typed<'youtube' | 'floatplane' | 'floatplane-live'>(),
		preShowLength = typed<number | null>(),
		i = typed<number>()
	} = $props();

	const seconds = $derived(Math.floor(message.t));
	const imageUrl = $derived(`//merch-message-images.whenplane.com/${show}/images/${seconds}.jpg`);

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

	let mounted = $state(false);
	onMount(() => setTimeout(() => mounted = true, 1))

</script>

<div
	class="mm-card"
	class:reply={message.type === 1}
	id={message.id ?? `${show}-${seconds}`}
	class:hashHighlight={page.url.hash === '#' + message.id}
>
	<div class="mm-text">
		<div>
			{#if message.type === 0}
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
				<span class="r"></span>
				 
				<div>
					<span class="op-8">Reply to</span>
					{message.name}
				</div>
			{/if}
		</div>

		<div>
			{message.text}
		</div>

		{#if i < 250 || mounted}
			<div class="mm-links" in:fade>
				{#if floatplaneSeconds != null && floatplaneId}
					<a
						href="//floatplane.com/post/{floatplaneId}?t={floatplaneSeconds}"
						rel="noopener"
						aria-label={i < 10 || mounted ? "Jump to in Floatplane VOD" : undefined}
					>
						<span class="fp" aria-hidden={i < 100 || mounted ? "true" : undefined}></span>
						{colonTimeString(floatplaneSeconds)}
					</a>
				{/if}
				{#if youtubeSeconds != null && youtubeSeconds >= 0}
					<a
						href="//youtu.be/{youtubeId}?t={youtubeSeconds}"
						rel="noopener"
						aria-label={i < 10 || mounted ? "Jump to in YouTube VOD" : undefined}
					>
						<span class="yt" aria-hidden={i < 100 || mounted ? "true" : undefined}></span>
						{colonTimeString(youtubeSeconds)}
					</a>
				{/if}
			</div>
		{/if}
	</div>
	<div class="mm-img">
		<a href={mounted ? imageUrl : undefined} aria-label={i < 10 || mounted ? "View Message Screenshot" : undefined}>
			{#key message}
				<img
					src={imageUrl}
					width="1000"
					height="200"
					loading="lazy"
					alt={i < 100 || mounted ? "" : undefined}
					aria-hidden={i < 50 || mounted ? "true" : undefined}
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

	span.r {
		@apply size-5 m-2;
		background-color: currentColor;
		height: 1.25em;
		width: 1.25em;
		mask: var(--ri) center / contain no-repeat;
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
