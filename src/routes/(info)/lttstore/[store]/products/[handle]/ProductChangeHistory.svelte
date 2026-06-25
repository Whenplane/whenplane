<script lang="ts">
  import { getDiffComponent } from "$lib/lttstore/field_components.js";
  import { getFieldName } from "$lib/lttstore/field_names.js";
  import DateStamp from "$lib/DateStamp.svelte";
  import { type ChangeHistoryTableRow, type ProductsTableRow, Store } from "$lib/lttstore/lttstore_types.js";
  import { onDestroy, onMount } from "svelte";
  import { dev } from "$app/environment";
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import { countTo, retry, wait } from "$lib/utils.js";
  import { page } from "$app/state";

  let {
    initialChangeHistory,
    product,
  }: {
    initialChangeHistory?: {
      changeHistory: ChangeHistoryTableRow[];
      page: {
        hasNextPage: boolean;
        nextOffset: number;
      }
    },
    product: ProductsTableRow
  } = $props();

  let loadTo = $state(0);

  let changeHistory: ChangeHistoryTableRow[] = $state([]);

  if(initialChangeHistory?.changeHistory) changeHistory.push(...initialChangeHistory.changeHistory)

  // svelte-ignore state_referenced_locally
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
    if(initialChangeHistory !== undefined) {
      (async () => {
        while(page.params.store === undefined) {
          await wait(100);
        }
        let hasNext = initialChangeHistory?.page.hasNextPage;
        let nextOffset = initialChangeHistory?.page.nextOffset ?? 0;
        while(hasNext && typeof nextOffset === "number") {
          if(!mounted) break;
          const response = await retry(() =>
            fetch(`/api/lttstore/${page.params.store}/products/${product.handle}/changeHistory?offset=${nextOffset}`)
              .then(r => r.json())
          );
          nextOffset = response.page.nextOffset;
          hasNext = response.page.hasNextPage;
          changeHistory.push(...response.changeHistory);
        }
      })();
      console.debug("Starting loading of diffs");
      loadTo += 5;
      loadInterval = setInterval(() => {
        if(loadTo < product.differences - 1) {
          loadTo += 10;
        } else {
          clearInterval(loadInterval);
          loadInterval = undefined;
        }
      }, 100);
    }
  }

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
    // for some reason page.url doesn't have the hash on initial load
    if(location.href.includes("#change-") && changeHistory !== null) {
      startLoading();
      const hash = new URL(location.href).hash;
      const match = document.getElementById(hash.substring(1));
      match?.scrollIntoView?.({behavior: "smooth", block: "center"});
      setTimeout(() => {
        match?.scrollIntoView?.({block: "center"});
      }, 1e3)
    }
  })

  onDestroy(() => {
    mounted = false;
    if(loadInterval) clearInterval(loadInterval);
  })


</script>

{#if mounted}
  <LazyLoad on:visible={startLoading}/>
{/if}
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
    {#each changeHistory as change, i (change.timestamp + change.field)}
      {@const DiffComponent = getDiffComponent(change.field)}
      <tr class="align-top" id="change-{change.field}-{change.timestamp}" class:hashHighlight={page.url.hash === `#change-${change.field}-${change.timestamp}`}>
        <td>{getFieldName(change.field)}</td>
        <td>
          <a class="hidden-link" href="#change-{change.field}-{change.timestamp}">
            <DateStamp epochSeconds={change.timestamp/1e3}/>
          </a>
        </td>
        {#if i <= loadTo}
          <td><DiffComponent before={change.old} after={change.new} displaying="before"/></td>
          <td><DiffComponent before={change.old} after={change.new} displaying="after"/></td>
        {:else}
          <td><div class="placeholder animate-pulse"></div></td>
          <td><div class="placeholder animate-pulse"></div></td>
        {/if}
      </tr>
    {/each}
    {#each countTo(product.differences - changeHistory.length) as _}
      <tr class="align-top">
        {#each ["field", "timestamp", "old", "new"] as _}
          <td>
            <div class="placeholder animate-pulse"></div>
          </td>
        {/each}
      </tr>
    {/each}
    </tbody>
    {#if page.data.store?.id === Store.US && product.firstSeen < 1727147700624}
      <tfoot>
      <tr class="text-center">
        <td class="p-2! opacity-70" colspan="4">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
      </tr>
      </tfoot>
    {/if}
    {#if page.data.store?.id === Store.GLOBAL && product.firstSeen < 1781787820145}
      <tfoot>
      <tr class="text-center">
        <td class="p-2! opacity-70" colspan="4">Changes before <DateStamp epochSeconds={1781787820}/> are not available</td>
      </tr>
      </tfoot>
    {/if}
  </table>
</div>

<style>
    .hashHighlight {
        border: #d4163c 2px solid;
        border-radius: 12px;
    }
</style>