<script lang="ts">
	import { run } from 'svelte/legacy';

	import * as Diff from 'diff';
	import { escapeHtml } from '$lib/utils.ts';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>(),
		diffType = $bindable<'chars' | 'words' | 'lines'>('chars')
	} = $props();

	let html: string = $state('');
	let parsedBefore = $derived(JSON.parse(before));
	let parsedAfter = $derived(JSON.parse(after));
	run(() => {
		if ((parsedBefore === 1 && parsedAfter === 0) || (parsedBefore === 0 && parsedAfter === 1)) {
			parsedBefore = parsedBefore === 1;
			parsedAfter = parsedAfter === 1;
			diffType = 'words';
		}
	});
	run(() => {
		html = '';
		let diff;
		switch (diffType) {
			case 'lines':
				diff = Diff.diffLines(parsedBefore + '', parsedAfter + '');
				break;
			case 'words':
				diff = Diff.diffWords(parsedBefore + '', parsedAfter + '', { ignoreWhitespace: true });
				break;
			case 'chars':
			default:
				diff = Diff.diffChars(parsedBefore + '', parsedAfter + '');
		}
		diff.forEach((part) => {
			const color = part.added ? 'green' : part.removed ? 'red' : false;

			const text = escapeHtml(part.value);

			if (!color) {
				html += text;
			} else {
				if (
					(color === 'green' && displaying === 'after') ||
					(color === 'red' && displaying === 'before')
				) {
					html += "<span style='color:" + color + "'>" + text + '</span>';
				} else {
					html += "<span style='background-color:" + color + "' class='opacity-40 pl-1'></span>";
				}
			}
		});

		if (diff.length === 0) {
			// if diff checking fails, just display the text
			console.debug('Diff did not return anything! Falling back to displaying text');
			html = escapeHtml(
				'' +
					(displaying === 'after'
						? typeof parsedAfter === 'string'
							? parsedAfter
							: JSON.stringify(parsedAfter)
						: typeof parsedBefore === 'string'
							? parsedBefore
							: JSON.stringify(parsedBefore))
			);
		}

		html = html.replaceAll('&lt;br&gt;', '<br>');
	});
</script>

{@html html}
