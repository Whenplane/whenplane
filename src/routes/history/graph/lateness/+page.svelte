<script lang="ts">
  import StatChart from "$lib/history/StatChart.svelte";
  import { getClosestWan, getTimeUntil, timeString } from "$lib/timeUtils";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";

  export let data;
</script>
<svelte:head>
  <title>WAN Lateness Graph - {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
</svelte:head>
<h1>Lateness</h1>
{#if browser}
  <StatChart shows={[...data.allShows].reverse()} transformFunction={(show) => {
    const snippet = show.value?.snippet ?? show.metadata?.snippet;

    const preShowStart = show.metadata.preShowStart ? new Date(show.metadata.preShowStart) : show.metadata.preShowStart;
    const mainShowStart = show.metadata.mainShowStart ? new Date(show.metadata.mainShowStart) : show.metadata.mainShowStart;
    const showEnd = show.metadata.showEnd ? new Date(show.metadata.showEnd) : show.metadata.showEnd;

    const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt));

    const preShowLength = preShowStart && mainShowStart ?
      getTimeUntil(mainShowStart, preShowStart.getTime()).string :
      null;
    const mainShowLength = mainShowStart && showEnd ?
      getTimeUntil(showEnd, mainShowStart.getTime()).string :
      (show.metadata?.mainShowLength ? timeString(show.metadata.mainShowLength) : null);

    const onTimeDistance = mainShowStart ? (showDate.getTime() - mainShowStart.getTime()) : null;

    return onTimeDistance ? onTimeDistance * -1 : onTimeDistance;
}}
  yFormatter={(d) => {
    let early = false;
    if(d < 0) {
      early = true;
      d = Math.abs(d);
    }
    if(d === 0) return "On time";
    return timeString(d) + (early ? " early" : " late")
  }}/>
{/if}