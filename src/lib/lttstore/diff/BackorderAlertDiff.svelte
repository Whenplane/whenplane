<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { BackorderAlerts } from "$lib/lttstore/lttstore_types.ts";
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";


  interface Props {
    before: string;
    after: string;
    displaying: "before" | "after";
  }

  let { before, after, displaying }: Props = $props();

  let parsedBefore = $derived(JSON.parse(before) as BackorderAlerts);
  let parsedAfter = $derived(JSON.parse(after) as BackorderAlerts);

  let beforeBackorderNotices = $state(new Set());
  run(() => {
    beforeBackorderNotices.clear();
    if(parsedBefore) {
      Object.values(parsedBefore).forEach(alert => {
        if(alert && alert.trim()) {
          beforeBackorderNotices.add(alert)
        }
      });
      beforeBackorderNotices = beforeBackorderNotices;
    }
  });

  let afterBackorderNotices = $state(new Set());
  run(() => {
    afterBackorderNotices.clear();
    if(parsedBefore) {
      Object.values(parsedAfter).forEach(alert => {
        if(alert && alert.trim()) {
          afterBackorderNotices.add(alert)
        }
      });
      afterBackorderNotices = afterBackorderNotices;
    }
  });

</script>
<TextDiff before={JSON.stringify([...beforeBackorderNotices].join("<br>"))} after={JSON.stringify([...afterBackorderNotices].join("<br>"))} {displaying} diffType="words"/>