<script lang="ts">
  import StatChart from "$lib/StatChart.svelte";
  import { getClosestWan, getTimeUntil, timeString } from "$lib/timeUtils";
  import { browser } from "$app/environment";

  export let data;
</script>
<svelte:head>
  <title>WAN Show Length Graph - Whenplane</title>
</svelte:head>
<h1>Main show length</h1>
{#if browser}
  <StatChart shows={[...data.allShows].reverse()} transformFunction={(show) => {
    const snippet = show.value?.snippet ?? show.metadata?.snippet;

    const preShowStart = show.metadata.preShowStart ? new Date(show.metadata.preShowStart) : show.metadata.preShowStart;
    const mainShowStart = show.metadata.mainShowStart ? new Date(show.metadata.mainShowStart) : show.metadata.mainShowStart;
    const showEnd = show.metadata.showEnd ? new Date(show.metadata.showEnd) : show.metadata.showEnd;

    const mainShowLength = mainShowStart && showEnd ?
      getTimeUntil(showEnd, mainShowStart.getTime()).distance :
      (show.metadata?.mainShowLength ? show.metadata?.mainShowLength : null);

    return mainShowLength;
  }}/>
{/if}