<script lang="ts">
  import { run } from 'svelte/legacy';


  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";
  import type { ProductDetailModule, ProductVariant } from "$lib/lttstore/lttstore_types.ts";
  import { getVariantFieldName } from "$lib/lttstore/field_names.ts";
  import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";




  interface Props {
    before: string;
    after: string;
    displaying: "before" | "after";
  }

  let { before, after, displaying }: Props = $props();

  let changedModules: string[] = $state([]);
  let parsedBefore = $derived((JSON.parse(before) as ProductDetailModule[]).map(m => {
    return {
      ...m,
      content: m.content.replaceAll("\n", "<br>\n"),
    }
  }));
  let parsedAfter = $derived((JSON.parse(after) as ProductDetailModule[]).map(m => {
    return {
      ...m,
      content: m.content.replaceAll("\n", "<br>\n"),
    }
  }));
  run(() => {
    for (let detailModule of parsedAfter) {
      if(!parsedBefore.find(m => m.title === detailModule.title)) {
        parsedBefore.push({
          title: detailModule.title,
          content: ""
        })
      }
    }
  });
  run(() => {
    changedModules = [];
    for (let detailModule of parsedBefore) {
      const beforeContent = detailModule.content;
      const afterContent = parsedAfter.find(m => m.title === detailModule.title)?.content ?? "";
      if(beforeContent != afterContent) {
        changedModules.push(detailModule.title);
      }
    }
  });
</script>
{#each parsedBefore.filter(m => changedModules.includes(m.title)) as module}
  <b>{module.title}</b><br>
  <div class="card p-2">
    <TextDiff before={JSON.stringify(module.content)} after={JSON.stringify(parsedAfter.find(m => m.title === module.title)?.content ?? "")} {displaying} diffType="words"/>
  </div>
  <br>
{/each}
