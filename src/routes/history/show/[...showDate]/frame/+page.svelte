<script>
  import HistoricalShow from "$lib/history/HistoricalShow.svelte";

  export let data;
</script>

<a href="https://whenplane.com/history/show/{data.name}" class="block text-center hidden-link" target="_parent">
  <HistoricalShow onlyTimes={true} show={data}/>
</a>

<style>
  :global(body,html) {
      overflow: hidden;
  }
</style>