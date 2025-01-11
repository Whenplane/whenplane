<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { commas } from "$lib/utils.ts";
  import { fade } from "svelte/transition";
  import { getTimePreference } from "$lib/prefUtils.ts";

  export let productName: string | undefined = undefined;

  export let stockHistory: {
    handle: string,
    id: number,
    timestamp: number,
    stock: string
  }[];

  export let chartUpdateNumber = 1;

  let chart;

  $: someStock = Object.keys(stockHistory).length >= 1 ? JSON.parse(stockHistory[0]?.stock ?? "{}") : {};

  let onlyTotalCheck = false;
  // show only the total for items where the stock is just the default + the total
  $: onlyTotal = Object.keys(someStock).length <= 2 || onlyTotalCheck;
  $: console.debug({onlyTotal, length: Object.keys(someStock).length, someStock, stockHistory})

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
          data: stockHistory.map((h, i, a) => {
            if(i > 0) {
              const previous = a[i-1];
              const previousStock = JSON.parse(previous.stock)[k]
              const timeDiff = h.timestamp - previous.timestamp;
              const stockDiff = previousStock - JSON.parse(h.stock)[k]
              return {
                x: h.timestamp,
                y: stockDiff / (timeDiff / (60 * 60e3))
              }
            } else {
              return {
                x: h.timestamp,
                y: -1
              }
            }
          }).filter(h => h.y >= 0)
        }
      })
    } else {
      return [{
        name: "total",
        data: stockHistory.map((h, i, a) => {
          if(i > 0) {
            const previous = a[i-1];
            const previousStock = JSON.parse(previous.stock)["total"]
            const timeDiff = h.timestamp - previous.timestamp;
            const stockDiff = previousStock - JSON.parse(h.stock)["total"]
            return {
              x: h.timestamp,
              y: stockDiff / (timeDiff / (60 * 60e3))
            }
          } else {
            return {
              x: h.timestamp,
              y: -1
            }
          }
        }).filter(h => h.y >= 0)
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
    series: {},
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
      max: 100
    },
    xaxis: {
      type: 'datetime'
    },
    tooltip: {
      theme: "dark",
      shared: true,
      y: {
        formatter: (n: number) => {
          if(n > 500000) {
            return ">500,000 sph"
          } else {
            return commas(n, 2) + " sph"
          }
        }
      },
      x: {
        formatter: function (val: number) {
          const date = new Date(val)
          return date.toLocaleDateString(undefined, {dateStyle: "medium"}) + " " + date.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})
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
    options.series = getSeries();
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
    <input type="checkbox" bind:checked={onlyTotalCheck}>
    Only show total in graph?
  </label>
{/if}
<small class="opacity-70">
  sph = sales per hour
</small>
<!--{JSON.stringify(stockHistory)}-->

