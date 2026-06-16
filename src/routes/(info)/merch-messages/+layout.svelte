<script lang="ts">
	import { typed } from '$lib';

	let { children = typed<import('svelte').Snippet>() } = $props();
</script>

{@render children?.()}
<br />
<div class="p-4">
	<span class="text-sm opacity-60">
		Whenplane and the Whenplane Merch Messages Index is not affiliated with or endorsed by Linus
		Media Group.
	</span>
</div>
