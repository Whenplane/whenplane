<script lang="ts">
	import type { ProductOption } from '$lib/lttstore/lttstore_types.ts';
	import TextDiff from '$lib/lttstore/diff/TextDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

	let parsedBefore = $derived(JSON.parse(before) as ProductOption[]);
	let parsedAfter = $derived(JSON.parse(after) as ProductOption[]);

	let changedOptions: string[] = $derived.by(() => {
		const changed: string[] = [];
		for (let beforeOption of parsedBefore) {
			const afterOption = parsedAfter.find((m) => m.name === beforeOption.name);
			if (JSON.stringify(beforeOption) != JSON.stringify(afterOption)) {
				changed.push(beforeOption.name);
			}
		}
		return changed;
	});
</script>

{#each parsedBefore.filter((m) => changedOptions.includes(m.name)) as option}
	{@const before = option.values.join('\n')}
	{@const after = parsedAfter
		.find((m) => m.name === option.name)
		?.values
		.join('\n')}
	<b>{option.name}</b>
	{#if after === undefined}
		<span class="opacity-30">&mdash;</span>
		<span class="text-red-500">Removed</span>
	{:else}
		<br />
		<TextDiff
			before={JSON.stringify(before)}
			after={JSON.stringify(after)}
			{displaying}
			diffType="lines"
		/>
	{/if}
	<br />
{/each}
