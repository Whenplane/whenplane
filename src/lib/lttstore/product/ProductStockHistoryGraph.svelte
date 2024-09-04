<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { commas } from "$lib/utils.ts";
  import { fade } from "svelte/transition";

  export let productName: string | undefined = undefined;

  export let stockHistory: {
    handle: string,
    id: number,
    timestamp: number,
    stock: string
  }[];

  export let chartUpdateNumber = 1;

  let chart;

  const someStock = Object.keys(stockHistory).length >= 1 ? JSON.parse(stockHistory[0]?.stock ?? "{}") : {};

  // show only the total for items where the stock is just the default + the total
  let onlyTotal = Object.keys(someStock).length <= 2;
  console.debug({onlyTotal, length: Object.keys(someStock).length, someStock, stockHistory})

  $: {
    onlyTotal;
    chartUpdateNumber;
    options.series = getSeries()
    // console.debug("Series:", options.series)
    if(chart) chart.updateSeries(options.series)
  }

  function getSeries() {
    if(!onlyTotal) {
      return Object.keys(someStock).map(k => {
        return {
          name: k,
          data: stockHistory.map(h => {
            return {
              x: h.timestamp,
              y: JSON.parse(h.stock)[k]
            }
          })
        }
      })
    } else {
      return [{
        name: "total",
        data: stockHistory.map(h => {
          return {
            x: h.timestamp,
            y: JSON.parse(h.stock)["total"]
          }
        })
      }]
    }
  }

  const options = {
    chart: {
      type: 'area',
      stacked: false,
      height: browser ? document.documentElement.clientHeight/1.5 : undefined,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    },
    series: getSeries(),
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
        formatter: (n: number) => {
          return commas(Math.round(n))
        },
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
  let mounted = false;
  onMount(async () => {
    mounted = true;
    ApexCharts = (await import("apexcharts")).default;
    chart = new ApexCharts(chartDiv, options);
    chart.render()

    // console.log({options})
  })

  // let style = browser ?  : undefined;
</script>

<div style="min-height: 69vh">
  {#if mounted}
    <div bind:this={chartDiv} in:fade></div>
  {/if}
</div>
{#if Object.keys(someStock).length > 2}
  <label>
    <input type="checkbox" bind:checked={onlyTotal}>
    Only show total in graph?
  </label>
{/if}
<!--{JSON.stringify(stockHistory)}-->

