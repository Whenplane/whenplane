<script lang="ts">
  import TextWordsDiff from "$lib/lttstore/diff/TextWordsDiff.svelte";




  interface Props {
    before: string;
    after: string;
    displaying: "before" | "after";
  }

  let { before, after, displaying }: Props = $props();
  let parsedBefore = $derived(JSON.parse(before));
  let parsedAfter = $derived(JSON.parse(after));
  let formatBefore = $derived(JSON.stringify(new Date(parsedBefore).toLocaleString()));
  let formatAfter = $derived(JSON.stringify(new Date(parsedAfter).toLocaleString()));
</script>
<TextWordsDiff before={formatBefore} after={formatAfter} {displaying}/>