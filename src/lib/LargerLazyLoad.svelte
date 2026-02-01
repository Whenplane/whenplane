<script lang="ts">
	import LazyLoad from '@dimfeld/svelte-lazyload';
	import { createEventDispatcher } from 'svelte';
	import { typed } from '$lib';
	const dispatch = createEventDispatcher();

	let {
		shown = $bindable<boolean>(false),
		before = typed<boolean>(false),
		after = typed<boolean>(true),
		children = typed<import('svelte').Snippet>()
	} = $props();
</script>

{#if shown && before}
	{@render children?.()}
{/if}
<div class="relative no-pointer-events width-1">
	<div class="absolute">
		<div class="relative bottom width-1">
			<LazyLoad
				on:visible={() => {
					shown = true;
					dispatch('visible');
				}}
				height="50em"
			/>
		</div>
	</div>
</div>
{#if shown && after}
	{@render children?.()}
{/if}

<style>
	.bottom {
		bottom: 25em;
	}
	.width-1 {
		width: 1rem;
	}
</style>
