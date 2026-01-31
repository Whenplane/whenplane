<script lang="ts">

  import HistoricalShow from "$lib/history/HistoricalShow.svelte";
  import { page } from "$app/stores";

  let { data } = $props();

  let filtered = $derived(data.oldShows.filter(s => !s.metadata.mainShowStart))

</script>

<svelte:head>
  <title>Shows with missing start times</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/history">History</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/history/missing">Missing</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Start Times</li>
</ol>

<div class="text-center">

  <br>
  <h1>Shows with missing start times</h1>
  Total of {filtered.length}
  <br>

  {#each filtered as show}
    {#if !show.metadata.mainShowStart}
      <HistoricalShow {show} withThumbnail={true} alternateStartTimes={data.alternateStartTimes}/>
    {/if}
  {/each}
</div>