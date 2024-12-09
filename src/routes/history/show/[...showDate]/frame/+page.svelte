<script>
  import HistoricalShow from "$lib/history/HistoricalShow.svelte";

  export let data;
</script>

<div class="text-center">
  <HistoricalShow onlyTimes={true} show={data}/>
</div>