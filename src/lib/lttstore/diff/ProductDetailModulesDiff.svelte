<script lang="ts">
	import { run } from 'svelte/legacy';


	import type { ProductDetailModule } from '$lib/lttstore/lttstore_types.ts';
	import TextDiff from '$lib/lttstore/diff/TextDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

	let changedModules: string[] = $state([]);
	let parsedBefore = $derived(
		(JSON.parse(before) as ProductDetailModule[]).map((m) => {
			return {
				...m,
				content: m.content.replaceAll('\n', '<br>\n')
			};
		})
	);
	let parsedAfter = $derived(
		(JSON.parse(after) as ProductDetailModule[]).map((m) => {
			return {
				...m,
				content: m.content.replaceAll('\n', '<br>\n')
			};
		})
	);
	run(() => {
		for (let detailModule of parsedAfter) {
			if (!parsedBefore.find((m) => m.title === detailModule.title)) {
				parsedBefore.push({
					title: detailModule.title,
					content: ''
				});
			}
		}
	});
	run(() => {
		changedModules = [];
		for (let detailModule of parsedBefore) {
			const beforeContent = detailModule.content;
			const afterContent = parsedAfter.find((m) => m.title === detailModule.title)?.content ?? '';
			if (beforeContent != afterContent) {
				changedModules.push(detailModule.title);
			}
		}
	});
</script>

{#each parsedBefore.filter((m) => changedModules.includes(m.title)) as module}
	<b>{module.title}</b><br />
	<div class="card p-2">
		<TextDiff
			before={JSON.stringify(module.content)}
			after={JSON.stringify(parsedAfter.find((m) => m.title === module.title)?.content ?? '')}
			{displaying}
			diffType="words"
		/>
	</div>
	<br />
{/each}
