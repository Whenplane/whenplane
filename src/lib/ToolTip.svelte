<script lang="ts">
		import type { Placement } from '@floating-ui/dom';
	import Info from '$lib/svg/Info.svelte';
	import { typed } from '$lib';

	let {
		id = typed<string>('default'),
		placement = typed<Placement>('top'),
		popupClasses = typed<string>(''),
		event = typed<'hover' | 'click' | 'hover-click' | 'focus' | 'focus-click'>('hover'),
		icon = typed<import('svelte').Snippet>(),
		children = typed<import('svelte').Snippet>(),
		content = typed<import('svelte').Snippet>()
	} = $props();

	if (id == 'default') {
		console.warn('Missing id on tooltip!');
	}
</script>

<div
	use:popup={{
		event,
		target: id,
		placement: placement
	}}
	class="inline-block *:pointer-events-none"
	class:cursor-pointer={event !== 'hover'}
>
	{#if icon}{@render icon()}{:else}
		<Info classes="inline-block!" />
	{/if}
</div>

<div class={'card p-4 shadow-x1 z-10 font-normal inline-block ' + popupClasses} data-popup={id}>
	{@render children?.()}
	{@render content?.()}
</div>

<style>
	.card {
		max-width: 60vw;
	}
</style>
