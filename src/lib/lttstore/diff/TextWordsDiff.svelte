<!-- The same as TextDiff, but default to word diff instead of char diff -->
<script lang="ts">
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";

  export let before: string;
  export let after: string;

  export let displaying: "before" | "after";
  export let diffType: "chars" | "words" = "words";
</script>

<TextDiff {before} {after} {displaying} {diffType}/>