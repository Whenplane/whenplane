<script lang="ts">
	import type { ProductVariant } from '$lib/lttstore/lttstore_types.ts';
	import { getVariantFieldName } from '$lib/lttstore/field_names.ts';
	import { typed } from '$lib';
	import TextDiff from './TextDiff.svelte';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

	let parsedBefore = $derived(JSON.parse(before) as ProductVariant[]);
	let parsedAfter = $derived(JSON.parse(after) as ProductVariant[]);

	type FieldDiff = {
		variantTitle: string;
		fieldName: string;
		subFieldName?: string;
		before: string;
		after: string;
	};

	let removed: string[] = [];

	let diffs = $derived.by((): FieldDiff[] => {
		const result: FieldDiff[] = [];
		removed = []

		for (let i = 0; i < parsedBefore.length; i++) {
			const beforeVariant = parsedBefore[i];
			const afterVariant = parsedAfter.find((v) => v.title === beforeVariant.title);

			for (let [key, beforeValue] of Object.entries(beforeVariant)) {
				const afterValue = (afterVariant as { [key: string]: any })?.[key];

				if (['null', 'undefined'].includes(typeof afterValue)) {
					if (!removed.includes(beforeVariant.title)) {
						result.push({
							variantTitle: beforeVariant.title,
							fieldName: 'removed',
							before: JSON.stringify(beforeVariant.title),
							after: JSON.stringify("")
						});
						removed.push(beforeVariant.title);
					}
				} else {
					if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
						if (typeof beforeValue === 'object' || typeof afterValue === 'object') {
							for (let [subKey, beforeSubValue] of Object.entries(beforeValue ?? {})) {
								const afterSubValue = (afterValue as { [key: string]: any })?.[subKey];
								if (JSON.stringify(beforeSubValue) === JSON.stringify(afterSubValue)) continue;

								result.push({
									variantTitle: beforeVariant.title,
									fieldName: getVariantFieldName(key),
									subFieldName: getVariantFieldName(subKey),
									before: JSON.stringify(beforeSubValue),
									after: afterSubValue === undefined ? JSON.stringify("") : JSON.stringify(afterSubValue)
								});
							}
						} else {
							result.push({
								variantTitle: beforeVariant.title,
								fieldName: getVariantFieldName(key),
								before: JSON.stringify(beforeValue),
								after: JSON.stringify(afterValue)
							});
						}
					}
				}
			}
		}

		return result;
	});
</script>

<div class="flex flex-col gap-2">
	{#each diffs as diff}
		{#if diff.fieldName === 'removed'}
			{#if displaying === 'after'}
				<span class="text-red-500">Removed {diff.variantTitle}</span>
			{:else}
				<span class="opacity-40 pl-1"></span>
			{/if}
		{:else if !removed.includes(diff.variantTitle)}
			<div>
				<div class="mb-1 text-sm">
					{diff.variantTitle}
					<span class="opacity-30">&mdash;</span>
					{diff.fieldName}
					{#if diff.subFieldName}
						<span class="opacity-30">&mdash;</span>
						{diff.subFieldName}
					{/if}
				</div>
				{@debug diff}
				<TextDiff
					before={diff.before}
					after={diff.after}
					diffType="words"
					{displaying}
				/>
			</div>
		{/if}
	{/each}
</div>