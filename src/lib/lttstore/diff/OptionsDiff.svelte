<script lang="ts">

  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";
  import type { ProductDetailModule, ProductOption, ProductVariant } from "$lib/lttstore/lttstore_types.ts";
  import { getVariantFieldName } from "$lib/lttstore/field_names.ts";
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";

  export let before: string;
  export let after: string;

  $: parsedBefore = JSON.parse(before) as ProductOption[];
  $: parsedAfter = JSON.parse(after) as ProductOption[];

  export let displaying: "before" | "after";

  let changedOptions: string[] = [];
  $: {
    changedOptions = [];
    for (let beforeOption of parsedBefore) {
      const afterOption = parsedAfter.find(m => m.name === beforeOption.name);
      if(JSON.stringify(beforeOption) != JSON.stringify(afterOption)) {
        changedOptions.push(beforeOption.name);
      }
    }
  }
</script>
{#each parsedBefore.filter(m => changedOptions.includes(m.name)) as option}
  <b>{option.name}</b><br>
  <div class="card p-2">
    <TextDiff before={JSON.stringify(option.values.join("<br>\n") + "<br>")} after={JSON.stringify(parsedAfter.find(m => m.name === option.name)?.values.join("<br>\n") + "<br>")} {displaying} diffType="lines"/>
  </div>
  <br>
{/each}
