<script lang="ts">

  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import * as airportData from "airport-data-js";
  import { dev } from "$app/environment";

  export let data;

  onMount(() => {
    let i = setInterval(invalidate, 5e3)
    return () => clearInterval(i);
  })

  let lastInvalidate = 0;
  function invalidate() {
    if(document.hidden && Date.now() - lastInvalidate < 30 * 60 * 60e3) return;

    lastInvalidate = Date.now();
    invalidateAll();

  }
</script>
<svelte:window on:focus={invalidate}/>

<div class="limit mx-auto">
  <h1 class="h1">Active Instances ({data.activeInstances.length})</h1>
  <table>
    {#each Object.entries(data.activeInstanceColos).toSorted((a, b) => b[1] - a[1]) as [colo, count]}
      {@const airport = airportData.getAirportByIata(colo)}
      <tr>
        <!--{@debug airport}-->
        <td>
          {colo}
        </td>
        <td class="pl-4">
          {#await airport}
            ...
          {:then airportInfo}
            {airportInfo[0].city}, {airportInfo[0].state}, {airportInfo[0].country_code}
          {/await}
        </td>
        <td class="pl-8">
          {#if count > 1 || dev}
            x{count}
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</div>