<script lang="ts">
  import type { StockCounts } from "$lib/lttstore/lttstore_types.ts";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { commas } from "$lib/utils.ts";

  export let productName = undefined;

  export let stockHistory: {
    handle: string,
    id: number,
    timestamp: number,
    stock: string
  }[];

  const someStock = Object.keys(stockHistory).length > 1 ? JSON.parse(stockHistory[0]?.stock ?? "{}") : {};

  console.log({someStock})

  const options = {
    chart: {
      type: 'area',
      stacked: false,
      width: browser ? document.documentElement.clientWidth/1.5 : undefined,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    },
    series: Object.keys(someStock).map(k => {
      return {
        name: k,
        data: stockHistory.map(h => {
          return {
            x: h.timestamp,
            y: JSON.parse(h.stock)[k]
          }
        })
      }
    }),
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0,
    },
    title: {
      text: productName ? 'Stock History - ' + productName : 'Stock History',
      align: 'left'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      },
    },
    yaxis: {
      labels: {
        formatter: commas,
      },
      title: {
        text: 'Stock'
      },
    },
    xaxis: {
      type: 'datetime'
    },
    tooltip: {
      theme: "dark",
      shared: true,
      y: {
        formatter: commas
      },
      x: {
        formatter: function (val: number) {
          const date = new Date(val)
          return date.toLocaleDateString(undefined, {dateStyle: "medium"}) + " " + date.toLocaleTimeString(undefined, {timeStyle: "short"})
        }
      }
    },
    grid: {
      borderColor: "#535A6C"
    }
  }

  let chartDiv: HTMLDivElement;

  let ApexCharts;

  let chart;
  onMount(async () => {
    ApexCharts = (await import("apexcharts")).default;
    chart = new ApexCharts(chartDiv, options);
    chart.render()

    console.log({options})
  })
</script>

<div bind:this={chartDiv}></div>
<!--{JSON.stringify(stockHistory)}-->

