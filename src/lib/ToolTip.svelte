<script lang="ts">
		import Info from '$lib/svg/Info.svelte';
		import { typed } from '$lib';
		import { popup, type Placement, type PopupSettings } from "$lib/replacements/popup.ts";

		let {
			id = typed<string>('default'),
			placement = typed<Placement>('top'),
			popupClasses = typed<string>(''),
			event = typed<PopupSettings["event"]>('hover'),
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
	{#if icon}
		{@render icon()}
	{:else}
		<Info />
	{/if}
</div>

<div class={'card p-4 shadow-x1 z-10 absolute font-normal inline-block ' + popupClasses} data-popup={id} style="opacity: 0; pointer-events: none;">
	{@render children?.()}
	{@render content?.()}
</div>

<style>
	.card {
		max-width: 60vw;
	}
</style>
