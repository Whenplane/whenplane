<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { DataTransformFunction, HistoricalEntry } from "$lib/utils.js";
  import { timeString } from "$lib/timeUtils";

  export let shows: HistoricalEntry[];
  export let transformFunction: DataTransformFunction;
  export let yFormatter = timeString

  let chartDiv;

  const options = {
    chart: {
      type: 'scatter',
      width: browser ? document.documentElement.clientWidth/1.5 : undefined
    },
    series: [{
      data: shows.map(transformFunction)
    }],
    xaxis: {
      categories: shows.map(value => value.name)
    },
    yaxis: {
      labels: {
        formatter: yFormatter
      }
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
      color: black;
  }
</style>