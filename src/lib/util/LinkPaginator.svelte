<script lang="ts">
	import { countTo } from '$lib/utils.ts';
	import { typed } from '$lib';
	import { page } from '$app/state';

	let {
		totalPages = typed<number>(),
		currentPage = typed<number>(40036)
	} = $props();

	let distance = $derived(Math.abs(currentPage - totalPages));

	function getPageLink(pageNumber: number) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('page', pageNumber + '');
		return page.url.pathname + '?' + params.toString();
	}
</script>

{#if currentPage > 1}
	{#if currentPage > 4}
		<a href={getPageLink(1)}>{1}</a>
		<a href={getPageLink(2)}>{2}</a>
		<a href={getPageLink(3)}>{3}</a>
		..
		<a href={getPageLink(currentPage - 2)}>{currentPage - 2}</a>
		<a href={getPageLink(currentPage - 1)}>{currentPage - 1}</a>
	{:else if currentPage > 0}
		{#each countTo(1, currentPage - 1) as i}
			<a href={getPageLink(i)}>{i}</a>
			<!-- this has to be here, otherwise there is no space between the numbers -->
			<span> </span>
		{/each}
	{/if}
{/if}

{#if totalPages > 1}
	<span class="px-2">
		{currentPage}
	</span>
{/if}

{#if currentPage < totalPages}
	{#if distance > 4}
		<a href={getPageLink(currentPage + 1)}>{currentPage + 1}</a>
		<a href={getPageLink(currentPage + 2)}>{currentPage + 2}</a>
		..
	{:else if distance > 0}
		{#each countTo(currentPage + 1, totalPages - 1) as i}
			<a href={getPageLink(i)}>{i}</a>
			<!-- this has to be here, otherwise there is no space between the numbers -->
			<span> </span>
		{/each}
	{/if}
	<a href={getPageLink(totalPages)}>{totalPages}</a>
{/if}

<style>
	a {
		@apply px-2;
	}
	button:hover {
		--tw-brightness: brightness(1.1);
		filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale)
			var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
	}
</style>
