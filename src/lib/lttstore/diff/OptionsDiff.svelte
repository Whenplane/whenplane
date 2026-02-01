<script lang="ts">
	import { run } from 'svelte/legacy';


	import type { ProductOption } from '$lib/lttstore/lttstore_types.ts';
	import TextDiff from '$lib/lttstore/diff/TextDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

	let changedOptions: string[] = $state([]);
	let parsedBefore = $derived(JSON.parse(before) as ProductOption[]);
	let parsedAfter = $derived(JSON.parse(after) as ProductOption[]);
	run(() => {
		changedOptions = [];
		for (let beforeOption of parsedBefore) {
			const afterOption = parsedAfter.find((m) => m.name === beforeOption.name);
			if (JSON.stringify(beforeOption) != JSON.stringify(afterOption)) {
				changedOptions.push(beforeOption.name);
			}
		}
	});
</script>

{#each parsedBefore.filter((m) => changedOptions.includes(m.name)) as option}
	<b>{option.name}</b><br />
	<div class="card p-2">
		<TextDiff
			before={JSON.stringify(option.values.join('<br>\n') + '<br>\n')}
			after={JSON.stringify(
				parsedAfter
					.find((m) => m.name === option.name)
					?.values
					.join('<br>\n')
					+ '<br>\n'
			)}
			{displaying}
			diffType="lines"
		/>
	</div>
	<br />
{/each}
