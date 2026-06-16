<script lang="ts">
  import HistoricalShow from "$lib/history/HistoricalShow.svelte";

  let { data } = $props();
</script>

<a href="https://whenplane.com/history/show/{data.name}" class="block text-center hidden-link" target="_parent">
  <HistoricalShow onlyTimes={true} show={data} alternateStartTimes={data.alternateStartTimes}/>
</a>

<style>
  :global(body,html) {
      overflow: hidden;
  }
</style>