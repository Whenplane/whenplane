<script lang="ts">

  import HistoricalShow from "$lib/HistoricalShow.svelte";

  export let data;

  $: filtered = data.oldShows.filter(s => !s.metadata.mainShowStart)

</script>

<div class="text-center">

  <h1>Shows with missing start times</h1>
  Total of {filtered.length}
  <br>

  {#each filtered as show}
    {#if !show.metadata.mainShowStart}
      <HistoricalShow {show} withThumbnail={true}/>
    {/if}
  {/each}
</div>