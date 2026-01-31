<!-- The same as TextDiff, but default to word diff instead of char diff -->
<script lang="ts">
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";


  interface Props {
    before: string;
    after: string;
    displaying: "before" | "after";
    diffType?: "chars" | "words";
  }

  let {
    before,
    after,
    displaying,
    diffType = "words"
  }: Props = $props();
</script>

<TextDiff {before} {after} {displaying} {diffType}/>