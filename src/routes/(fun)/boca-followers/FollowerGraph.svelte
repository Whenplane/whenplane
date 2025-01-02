<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { commas } from "$lib/utils.ts";
  import { getTimePreference } from "$lib/prefUtils.ts";

  export let followerHistory: {
    timestamp: number,
    [key: string]: number | null
  }[];

  let chart;

  let keys = [...new Set(followerHistory.map(h => Object.keys(h).filter(k => k !== "timestamp")).flat())];


  function getSeries() {
    return keys.map(k => {
      return {
        name: k,
        data: followerHistory.map(h => {
          if(h[k] === null) return;
          return {
            x: h.timestamp,
            y: h[k]
          }
        }).filter(d => typeof d !== "undefined")
      }
    })
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
      text: "Boca Follower History",
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
  onMount(async () => {
    ApexCharts = (await import("apexcharts")).default;
    chart = new ApexCharts(chartDiv, options);
    chart.render()

    // console.log({options})
  })
</script>

<div bind:this={chartDiv}></div>
<!--{JSON.stringify(stockHistory)}-->

