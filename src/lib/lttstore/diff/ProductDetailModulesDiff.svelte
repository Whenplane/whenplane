<script lang="ts">
	import type { ProductDetailModule } from '$lib/lttstore/lttstore_types.ts';
	import TextDiff from '$lib/lttstore/diff/TextDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

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

	// Add missing modules to parsedBefore for display
	let filledParsedBefore = $derived.by(() => {
		const result = [...parsedBefore];
		for (let detailModule of parsedAfter) {
			if (!result.find((m) => m.title === detailModule.title)) {
				result.push({
					title: detailModule.title,
					content: ''
				});
			}
		}
		return result;
	});

	let changedModules: string[] = $derived.by(() => {
		const changed: string[] = [];
		for (let detailModule of filledParsedBefore) {
			const beforeContent = detailModule.content;
			const afterContent = parsedAfter.find((m) => m.title === detailModule.title)?.content ?? '';
			if (beforeContent != afterContent) {
				changed.push(detailModule.title);
			}
		}
		return changed;
	});
</script>

{#each filledParsedBefore.filter((m) => changedModules.includes(m.title)) as module}
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
