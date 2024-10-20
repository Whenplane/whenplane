<script lang="ts">
  import TextWordsDiff from "$lib/lttstore/diff/TextWordsDiff.svelte";

  export let before: string;
  export let after: string;

  $: parsedBefore = JSON.parse(before);
  $: parsedAfter = JSON.parse(after);

  $: formatBefore = JSON.stringify(new Date(parsedBefore).toLocaleString());
  $: formatAfter = JSON.stringify(new Date(parsedAfter).toLocaleString());

  export let displaying: "before" | "after";
</script>
<TextWordsDiff before={formatBefore} after={formatAfter} {displaying}/>