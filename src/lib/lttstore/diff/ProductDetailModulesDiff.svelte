<script lang="ts">

  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";
  import type { ProductDetailModule, ProductVariant } from "$lib/lttstore/lttstore_types.ts";
  import { getVariantFieldName } from "$lib/lttstore/field_names.ts";
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";

  export let before: string;
  export let after: string;

  $: parsedBefore = (JSON.parse(before) as ProductDetailModule[]).map(m => {
    return {
      ...m,
      content: m.content.replaceAll("\n", "<br>\n"),
    }
  });
  $: parsedAfter = (JSON.parse(after) as ProductDetailModule[]).map(m => {
    return {
      ...m,
      content: m.content.replaceAll("\n", "<br>\n"),
    }
  });

  $: {
    for (let detailModule of parsedAfter) {
      if(!parsedBefore.find(m => m.title === detailModule.title)) {
        parsedBefore.push({
          title: detailModule.title,
          content: ""
        })
      }
    }
  }

  export let displaying: "before" | "after";

  let changedModules: string[] = [];
  $: {
    changedModules = [];
    for (let detailModule of parsedBefore) {
      const beforeContent = detailModule.content;
      const afterContent = parsedAfter.find(m => m.title === detailModule.title)?.content ?? "";
      if(beforeContent != afterContent) {
        changedModules.push(detailModule.title);
      }
    }
  }
</script>
{#each parsedBefore.filter(m => changedModules.includes(m.title)) as module}
  <b>{module.title}</b><br>
  <TextDiff before={JSON.stringify(module.content)} after={JSON.stringify(parsedAfter.find(m => m.title === module.title)?.content ?? "")} {displaying}/>
  <br>
{/each}
