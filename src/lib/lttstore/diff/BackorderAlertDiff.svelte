<script lang="ts">
	import type { BackorderAlerts } from '$lib/lttstore/lttstore_types.ts';
	import TextDiff from '$lib/lttstore/diff/TextDiff.svelte';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>()
	} = $props();

	let parsedBefore = $derived(JSON.parse(before) as BackorderAlerts);
	let parsedAfter = $derived(JSON.parse(after) as BackorderAlerts);

	let beforeBackorderNotices = $derived.by(() => {
		const notices = new Set<string>();
		if (parsedBefore) {
			Object.values(parsedBefore).forEach((alert) => {
				if (alert && alert.trim()) {
					notices.add(alert);
				}
			});
		}
		return notices;
	});

	let afterBackorderNotices = $derived.by(() => {
		const notices = new Set<string>();
		if (parsedBefore) {
			Object.values(parsedAfter).forEach((alert) => {
				if (alert && alert.trim()) {
					notices.add(alert);
				}
			});
		}
		return notices;
	});
</script>

<TextDiff
	before={JSON.stringify([...beforeBackorderNotices].join('<br>'))}
	after={JSON.stringify([...afterBackorderNotices].join('<br>'))}
	{displaying}
	diffType="words"
	card={false}
/>
