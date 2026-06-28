<script lang="ts">
  import { getDiffComponent } from "$lib/lttstore/field_components.js";
  import { getFieldName } from "$lib/lttstore/field_names.js";
  import DateStamp from "$lib/DateStamp.svelte";
  import { type ChangeHistoryTableRow, Store } from "$lib/lttstore/lttstore_types.js";
  import { onDestroy, onMount } from "svelte";
  import { dev } from "$app/environment";
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import { countTo, retry, wait } from "$lib/utils.js";
  import { page } from "$app/state";
	import type { RequireAtLeastOne } from "$lib";

  let {
    initialChangeHistory,
    handle,
    id,
    firstSeen,
    differences = 0,
    collection,
    hideUpdated
  }: RequireAtLeastOne<{
    initialChangeHistory?: {
      changeHistory: ChangeHistoryTableRow[];
      page: {
        hasNextPage: boolean;
        nextOffset: number;
      }
    },
    handle?: string,
    id?: number,
    firstSeen: number,
    differences?: number
    collection?: boolean
    hideUpdated?: boolean
  }, 'handle' | 'id'> = $props();

  let loadTo = $state(0);

  let changeHistory: ChangeHistoryTableRow[] = $state([]);

  if(initialChangeHistory?.changeHistory) {
    console.debug(`Got ${initialChangeHistory.changeHistory.length} initial change history entries`);
    changeHistory.push(...initialChangeHistory.changeHistory)
  }

  // svelte-ignore state_referenced_locally
  if(dev && initialChangeHistory !== null) {
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
  let finishedLoading = false;

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
            fetch(`/api/lttstore/${page.params.store}/${collection ? "collections" : "products"}/${id ?? handle}/changeHistory?offset=${nextOffset}`)
              .then(async (r) => {
                if(r.status === 429) {
                  await wait(11e3);
                  throw new Error("Ratelimited")
                } else {
                  return r.json();
                }
              })
          );
          nextOffset = response.page.nextOffset;
          hasNext = response.page.hasNextPage;
          changeHistory.push(...response.changeHistory);
          if(!differences || (differences / 100) >= 14) {
            await wait(800); // to prevent rate limiting
          }
        }
        finishedLoading = true;
      })();
      console.debug("Starting loading of diffs");
      loadTo += 5;
      loadInterval = setInterval(() => {
        if(!finishedLoading && loadTo > changeHistory.length) return;
        if(loadTo < (differences || changeHistory.length) - 1) {
          loadTo += 10;
        } else if(differences || finishedLoading) {
          console.debug("Finished loading diffs after " + loadTo)
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

  let changeStart = $derived(
    page.data.store?.id === Store.US
      ? (
        collection
          ? 1732525260000
          : 1727147700624
      )
      : 1781787820145 // collection and product changes started on the same day for global
  )


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
    {#each (hideUpdated ? changeHistory.filter(c => c.field !== "updated_at") : changeHistory) as change, i (change.timestamp + change.field)}
      {@const fieldPrefix = collection ? "collection-" : ""}
      {@const DiffComponent = getDiffComponent(fieldPrefix + change.field)}
      <tr class="align-top" id="change-{change.field}-{change.timestamp}" class:hashHighlight={page.url.hash === `#change-${change.field}-${change.timestamp}`}>
        <td>{getFieldName(fieldPrefix + change.field)}</td>
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
    {#if differences}
      {#each countTo(differences - changeHistory.length) as _}
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
    {#if firstSeen < changeStart}
      <tfoot>
      <tr class="text-center">
        <td class="p-2! opacity-70" colspan="4">
          Changes before <DateStamp epochSeconds={Math.floor(changeStart / 1e3)}/> are not available
        </td>
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