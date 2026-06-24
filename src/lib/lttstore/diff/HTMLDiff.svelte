<script lang="ts">
  import TextWordsDiff from '$lib/lttstore/diff/TextWordsDiff.svelte';
  import { typed } from '$lib';

  let {
    before = typed<string>(),
    after = typed<string>(),
    displaying = typed<'before' | 'after'>(),
    format = typed<string | undefined>()
  } = $props();
</script>

<TextWordsDiff {before} {after} {displaying} format={format ?? "html"}/>
