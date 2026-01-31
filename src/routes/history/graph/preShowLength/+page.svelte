<script lang="ts">
  import StatChart from "$lib/history/StatChart.svelte";
  import { getClosestWan, getTimeUntil, timeString } from "$lib/timeUtils";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";

  let { data } = $props();
</script>
<svelte:head>
  <title>WAN Pre-show Length - {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
</svelte:head>
<h1>Pre-show length</h1>
{#if browser}
  <StatChart shows={[...data.allShows].reverse()} transformFunction={(show) => {
    const snippet = show.value?.snippet ?? show.metadata?.snippet;

    const preShowStart = show.metadata.preShowStart ? new Date(show.metadata.preShowStart) : show.metadata.preShowStart;
    const mainShowStart = show.metadata.mainShowStart ? new Date(show.metadata.mainShowStart) : show.metadata.mainShowStart;
    const showEnd = show.metadata.showEnd ? new Date(show.metadata.showEnd) : show.metadata.showEnd;

    const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt), data.alternateStartTimes);

    const preShowLength = preShowStart && mainShowStart ?
      getTimeUntil(mainShowStart, preShowStart.getTime()).distance :
      null;

    return preShowLength;
}}/>
{/if}