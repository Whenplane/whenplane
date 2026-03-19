<script lang="ts">
  import { getDiffComponent } from "$lib/lttstore/field_components.ts";
  import { getFieldName } from "$lib/lttstore/field_names.ts";
  import { typed } from "$lib";
  import DateStamp from "$lib/DateStamp.svelte";
  import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
  import { onDestroy, onMount } from "svelte";
  import { dev } from "$app/environment";
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import { countTo } from "$lib/utils.ts";

  let {
    changeHistory = typed<{
      id: number
      timestamp: number
      field: string
      old: string
      new: string
    }[]>(),
    product = typed<ProductsTableRow>(),
  } = $props();

  let loadTo = $state(0);

  if(dev && changeHistory !== null) {
    $effect.pre(() => {
      let occurrences: {[key: string]: number} = {};
      for(let change of changeHistory) {
        const id = change.timestamp + change.field;
        occurrences[id] = (occurrences[id] ?? 0) + 1;
      }
      for (let [id, occ] of Object.entries(occurrences)) {
        if(occ > 1) {
          console.warn(`${id} occurred ${occ} times!`);
          const last = changeHistory.findLast(c => c.timestamp + c.field === id);
          if(last) {
            const lastIndex = changeHistory.lastIndexOf(last);
            changeHistory = changeHistory.filter((c, i) => {
              if(c.timestamp + c.field !== id) return true;
              return i !== lastIndex;
            });
          }
        }
      }
    })
  }
  let loadInterval: NodeJS.Timer | undefined;

  // limits the number of changes loaded at once to reduce cpu usage spike
  function startLoading() {
    if(loadInterval) return;
    if(changeHistory !== null) {
      console.debug("Starting loading of diffs");
      loadTo++;
      loadInterval = setInterval(() => {
        if(loadTo < changeHistory.length - 1) {
          loadTo++;
        } else {
          clearInterval(loadInterval);
          loadInterval = undefined;
        }
      }, 75);
    }
  }

  onDestroy(() => {
    if(loadInterval) clearInterval(loadInterval);
  })


</script>

<LazyLoad on:visible={startLoading}/>
<div class="table-container rounded-md">
  <table class="table rounded-md w-full table-fixed">
    <thead>
    <tr>
      <th>What changed</th>
      <td>Change seen</td>
      <th class="w-[42%]">Before</th>
      <th class="w-[42%]">After</th>
    </tr>
    </thead>
    <tbody>
      {#if changeHistory !== null}
        {#each changeHistory as change, i (change.timestamp + change.field)}
          {@const BeforeComponent = getDiffComponent(change.field)}
          {@const AfterComponent = getDiffComponent(change.field)}
          <tr class="align-top">
            <td>{getFieldName(change.field)}</td>
            <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
            {#if i <= loadTo}
              <td><BeforeComponent before={change.old} after={change.new} displaying="before"/></td>
              <td><AfterComponent before={change.old} after={change.new} displaying="after"/></td>
            {:else}
              <td><div class="placeholder animate-pulse"></div></td>
              <td><div class="placeholder animate-pulse"></div></td>
            {/if}
          </tr>
        {/each}
      {:else}
        {#each countTo(product.differences ?? 10) as _}
          <tr class="align-top">
            {#each ["field", "timestamp", "old", "new"] as _}
              <td>
                <div class="placeholder animate-pulse"></div>
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
    {#if product.firstSeen < 1727147700624}
      <tfoot>
      <tr class="text-center">
        <td class="p-2! opacity-70" colspan="4">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
      </tr>
      </tfoot>
    {/if}
  </table>
</div>