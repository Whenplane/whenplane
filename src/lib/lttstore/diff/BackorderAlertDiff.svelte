<script lang="ts">
  import type { BackorderAlerts } from "$lib/lttstore/lttstore_types.ts";
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";

  export let before: string;
  export let after: string;

  export let displaying: "before" | "after";

  $: parsedBefore = JSON.parse(before) as BackorderAlerts;
  $: parsedAfter = JSON.parse(after) as BackorderAlerts;

  let beforeBackorderNotices = new Set();
  $: {
    beforeBackorderNotices.clear();
    if(parsedBefore) {
      Object.values(parsedBefore).forEach(alert => {
        if(alert && alert.trim()) {
          beforeBackorderNotices.add(alert)
        }
      });
      beforeBackorderNotices = beforeBackorderNotices;
    }
  }

  let afterBackorderNotices = new Set();
  $: {
    afterBackorderNotices.clear();
    if(parsedBefore) {
      Object.values(parsedAfter).forEach(alert => {
        if(alert && alert.trim()) {
          afterBackorderNotices.add(alert)
        }
      });
      afterBackorderNotices = afterBackorderNotices;
    }
  }

</script>
<TextDiff before={JSON.stringify([...beforeBackorderNotices].join("<br>"))} after={JSON.stringify([...afterBackorderNotices].join("<br>"))} {displaying} diffType="words"/>