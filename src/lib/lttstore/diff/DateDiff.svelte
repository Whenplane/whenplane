<script lang="ts">
	import TextWordsDiff from '$lib/lttstore/diff/TextWordsDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();
	let parsedBefore = $derived(JSON.parse(before));
	let parsedAfter = $derived(JSON.parse(after));
	let formatBefore = $derived(JSON.stringify(new Date(parsedBefore).toLocaleString()));
	let formatAfter = $derived(JSON.stringify(new Date(parsedAfter).toLocaleString()));
</script>

<TextWordsDiff before={formatBefore} after={formatAfter} {displaying} />
