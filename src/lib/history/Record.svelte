<script lang="ts">
	import { getClosestWan, timeString } from '$lib/timeUtils';
	import Late from '$lib/Late.svelte';
	import { page } from '$app/state';
	import { getDateFormatLocale } from '$lib/prefUtils.ts';
	import type { BestShow } from '../../app';
	import { typed } from '$lib';

	let {
		record = typed<BestShow | number>(),
		asTime = typed<boolean>(true),
		color = typed<boolean>(true),
		late = typed<boolean>(false),
		early = typed<boolean>(false),
		selected = typed<boolean>(false),
		loading = typed<boolean>(false),
		children = typed<import('svelte').Snippet>(),
		description = typed<import('svelte').Snippet>()
	} = $props();
</script>

<div class="box text-center" class:selected>
	<h4>{@render children?.()}</h4>
	<div>
		{@render description?.()}
	</div>
	{#if record}
		<span class:late={late && color} class:early={early && color}>
			{#if asTime}
				{timeString(Math.abs(typeof record === 'number' ? record : record.distance))}
				{#if late}
					<Late />
				{/if}
				{#if early}
					early
				{/if}
			{:else}
				{record}
			{/if}
		</span>
		<br />
		{#if record.name}
			<span class="small">
				<a href="/history/show/{record.name}" class="hidden-link underline">
					{
						getClosestWan(new Date(record.name), page.data.alternateStartTimes)
							.toLocaleDateString(getDateFormatLocale())
					}
				</a>
			</span>
		{/if}
	{:else if loading}
		<span class="placeholder animate-pulse inline-block w-48"></span>
		<span class="small placeholder animate-pulse inline-block w-32"></span>
	{:else}
		<span class="opacity-50">N/A</span>
	{/if}
</div>

<style>
	@reference "#app.css";

	.box {
		@apply inline-block border border-surface-500 p-2 m-1 mb-2 rounded-md;
		width: 300px;
	}
	.small {
		@apply opacity-75;
		font-size: 0.75em;
	}

	.late {
		color: red;
	}
	.early {
		color: green;
	}

	.placeholder {
		height: 1.25em !important;
	}

	.selected {
		background-color: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2) !important;
	}
</style>
