<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { type DataTransformFunction, type HistoricalEntry } from "$lib/utils";
  import { timeString } from "$lib/timeUtils.ts";
  import { getDateFormatLocale } from "$lib/prefUtils.ts";

  interface Props {
    shows: HistoricalEntry[];
    transformFunction: DataTransformFunction;
    yFormatter?: any;
  }

  let { shows, transformFunction, yFormatter = timeString }: Props = $props();

  let chartDiv = $state();

  const showNames = shows.map(value => value.name);

  const options = {
    chart: {
      type: 'scatter',
      width: browser ? document.documentElement.clientWidth/1.5 : undefined,
      events: {
        click: (event, chartContext, config) => {
          const show = shows[config.dataPointIndex];
          window.open("/history/show/" + show.name, "_blank");
        }
      }
    },
    series: [{
      data: shows.map(transformFunction)
    }],
    tooltip: {
      x: {
        formatter: (i) => {
          const show = shows[i-1]
          const date = new Date(show.name);
          const string = date.toLocaleDateString(undefined, { dateStyle: "long" });
          return string + (show.metadata.title ? ": " + show.metadata.title : "");
        }
      }
    },
    xaxis: {
      categories: showNames,
      labels: {
        formatter: (name) => new Date(name).toLocaleDateString(getDateFormatLocale())
      }
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