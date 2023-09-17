<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { DataTransformFunction, HistoricalEntry } from "$lib/utils.js";

  export let shows: HistoricalEntry[];
  export let transformFunction: DataTransformFunction;

  let chartDiv;

  const options = {
    chart: {
      type: 'scatter',
      width: browser ? document.documentElement.clientWidth/1.5 : undefined
    },
    series: [{
      name: 'time',
      data: shows.map(transformFunction)
    }],
    xaxis: {
      categories: shows.map(value => value.name)
    }
  }

  let ApexCharts;

  let chart;
  onMount(async () => {
    ApexCharts = (await import("apexcharts")).default
    console.log({ApexCharts})
    chart = new ApexCharts(chartDiv, options);
    chart.render()
  })

</script>
<div bind:this={chartDiv}></div>

<style>
  div {
      width: 50vw;
  }
</style>