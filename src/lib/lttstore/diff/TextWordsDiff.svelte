<!-- The same as TextDiff, but default to word diff instead of char diff -->
<script lang="ts">
	import TextDiff from '$lib/lttstore/diff/TextDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>(),
		diffType = typed<'chars' | 'words'>('words')
	} = $props();
</script>

<TextDiff {before} {after} {displaying} {diffType} />
