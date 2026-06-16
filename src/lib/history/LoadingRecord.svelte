<script lang="ts">
	import Record from '$lib/history/Record.svelte';
	import { typed } from '$lib';

	let { children = typed<import('svelte').Snippet>() } = $props();
</script>

<Record loading={true}>
	{@render children?.()}
</Record>
