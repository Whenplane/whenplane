<script lang="ts">

  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { browser, dev } from "$app/environment";

  const airportData = browser ? import("airport-data-js") : new Promise(() => {})

  export let data;

  onMount(() => {
    let i = setInterval(invalidate, 5e3)
    return () => clearInterval(i);
  })

  let lastInvalidate = 0;
  function invalidate() {
    if(document.hidden && Date.now() - lastInvalidate < 5 * 60 * 60e3) return;

    lastInvalidate = Date.now();
    invalidateAll();

  }
</script>
<svelte:window on:focus={invalidate} on:visibilitychange={invalidate}/>
<svelte:head>
  <title>Whenplane Instances</title>
</svelte:head>

<div class="limit mx-auto">
  <h1 class="h1">Active Instances ({data.activeInstances.length})</h1>
  <table>
    {#each Object.entries(data.activeInstanceColos).toSorted((a, b) => b[1] - a[1]) as [colo, count]}
      {@const airport = airportData.then(d => d.getAirportByIata(colo))}
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
  <br>
  <br>
  <br>

  <h1 class="h1">Inactive Instances ({data.inactiveInstances.length})</h1>
  <table>
    {#each Object.entries(data.inactiveInstanceColos).toSorted((a, b) => b[1] - a[1]) as [colo, count]}
      {@const airport = airportData.then(d => d.getAirportByIata(colo))}
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