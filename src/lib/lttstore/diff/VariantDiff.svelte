<script lang="ts">
	import { run } from 'svelte/legacy';

	import type { ProductVariant } from '$lib/lttstore/lttstore_types.ts';
	import { getVariantFieldName } from '$lib/lttstore/field_names.ts';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

	let html: string = $state('');
	let parsedBefore = $derived(JSON.parse(before) as ProductVariant[]);
	let parsedAfter = $derived(JSON.parse(after) as ProductVariant[]);
	run(() => {
		html = '';
		let removed: string[] = [];
		for (let i = 0; i < parsedBefore.length; i++) {
			const beforeVariant = parsedBefore[i];
			const afterVariant = parsedAfter.find((v) => v.title === beforeVariant.title);
			for (let beforeEntry of Object.entries(beforeVariant)) {
				const key = beforeEntry[0];
				const beforeValue = beforeEntry[1];
				const afterValue = (afterVariant as { [key: string]: any })?.[key];
				if (['null', 'undefined'].includes(typeof afterValue)) {
					if (!removed.includes(beforeVariant.title)) {
						if (displaying === 'after') {
							html +=
								"<span style='background-color: rgba(255, 0, 0, 0.2)'>" +
								'Removed ' +
								beforeVariant.title +
								'</span><br>';
						} else {
							html +=
								"<span style='background-color: rgba(255, 0, 0, 0.2)' class='opacity-40 pl-1'></span><br>";
						}
						removed.push(beforeVariant.title);
					}
				} else {
					if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
						if (typeof beforeValue === 'object' || typeof afterValue === 'object') {
							for (let beforeValueEntry of Object.entries(beforeValue ?? {})) {
								const subKey = beforeValueEntry[0];
								const beforeSubValue = beforeValueEntry[1];
								const afterSubValue = (afterValue as { [key: string]: any })?.[subKey];
								if (JSON.stringify(beforeSubValue) === JSON.stringify(afterSubValue)) continue;
								html +=
									beforeVariant.title +
									': ' +
									getVariantFieldName(key) +
									': ' +
									getVariantFieldName(subKey) +
									' ' +
									"<span style='background-color: rgba(" +
									(displaying == 'before' ? '255, 0, 0' : '0, 255, 0') +
									", 0.2)'>" +
									(displaying == 'before' ? beforeSubValue : afterSubValue) +
									'</span><br>';
							}
						} else {
							html +=
								beforeVariant.title +
								': ' +
								getVariantFieldName(key) +
								': ' +
								"<span style='background-color: rgba(" +
								(displaying == 'before' ? '255, 0, 0' : '0, 255, 0') +
								", 0.2)'>" +
								(displaying == 'before' ? beforeValue : afterValue) +
								'</span><br>';
						}
					}
				}
			}
		}

		html = html.replace(/\n/g, '<br>').replace(/\t/g, '&emsp;');
	});
</script>

{@html html}
