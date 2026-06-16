<script lang="ts">
  import { onMount } from 'svelte';
  import { commas } from '$lib/utils.ts';
  import { fade } from 'svelte/transition';
  import type { StockTotalsRow } from "$lib/lttstore/lttstore_types.ts";
  import { typed } from '$lib';
  import UplotSvelte from 'uplot-svelte';
  import uPlot from "uplot";
  import 'uplot/dist/uPlot.min.css';
  import { stockGaps, timeFormat, stockColors } from '$lib/lttstore/product/ProductStockHistoryGraph.svelte';
  import { browser } from "$app/environment";

  let {
    stockHistory,
    chartUpdateNumber = typed<number>(1),
    historyDays = typed<number | "all">("all"),
    stockAsOf = typed<number>(Date.now())
  }: {
    stockHistory: StockTotalsRow[],
    chartUpdateNumber?: number,
    historyDays?: number | "all",
    stockAsOf?: number,
  } = $props();

  let wrapperDiv = $state<HTMLDivElement>();

  let stores = $derived([...new Set(stockHistory.map(s => s.store))]);
  let perStoreTotals = $derived(Object.fromEntries(stores.map(s => [s, stockHistory.filter(h => h.store === s)])));

  const storeNames: {[key: string]: string} = {
    "0": "US",
    "1": "Global"
  }


  let data = $derived.by(() => {
    return [
      [
        ...(historyDays === "all" ? [] : [Math.round((Date.now() - (historyDays * 24 * 60 * 60e3)) / 1e3)]),
        ...Object.keys(perStoreTotals).map((s, si) => perStoreTotals[s]
          .map((h, i) => {
            const previous = perStoreTotals[s]?.[i-1];
            if(!previous) console.debug({previous, h, i})
            return i === 0
              ? Math.round(h.timestamp / 1e3)
              : Math.round((previous.timestamp + h.timestamp) / 2 / 1e3)
          })
        ).flat().sort((a, b) => a - b),
        Math.round(stockAsOf / 1e3)
      ],
      ...(Object.keys(perStoreTotals))
        .map(s => [
          ...(historyDays === "all" ? [] : [null]),
          ...stockHistory.map((h, i) => {
            if(h.store+"" !== s+"") return null;
            if(i > 0) {
              const indexInStore = perStoreTotals[s].findIndex(h2 => h2.timestamp === h.timestamp);
              if(indexInStore <= 0) return null;
              const previous = perStoreTotals[s][indexInStore-1];
              const previousStock = previous.total;
              const currentStock = h.total;
              if(previousStock === null || currentStock === null) return null;
              const timeDiff = h.timestamp - previous.timestamp;
              const stockDiff = previousStock - currentStock;
              const rate = stockDiff / (timeDiff / (60 * 60e3));
              if(rate < 0) return null;
              return rate;
            } else {
              return null;
            }
          }),
          null
        ])
    ]
  });

  let width = $derived(wrapperDiv?.clientWidth ?? 1490);
  let height = $derived(width / 2);

  if(browser) {
    const resizeObserver = new ResizeObserver(() => {
      const newWidth = wrapperDiv?.clientWidth ?? 1490;
      setTimeout(() => {
        if(newWidth === (wrapperDiv?.clientWidth ?? 1490)) {
          width = newWidth;
        }
      }, 100);
    });
    $effect(() => wrapperDiv && resizeObserver.observe(wrapperDiv));
  }

  const options: uPlot.Options = $derived({
    title: 'Move Rate History - All Products',
    id: "all-move-rate-" + chartUpdateNumber,
    width,
    height,
    class: "max-w-full",
    series: [
      {
        label: "Time",
        value: timeFormat,
      },
      ...(Object.keys(perStoreTotals))
        .map((k, i) => ({
          show: true,
          gaps: stockGaps,
          paths: uPlot.paths.spline?.(),
          label: storeNames[k] ?? k,
          value: (_, rawValue: number | null) => rawValue === null ? "" : commas(Math.round(rawValue * 100) / 100)! + " sph",
          stroke: stockColors[i % stockColors.length],
          fill: `${stockColors[i % stockColors.length]}20`,
          points: {
            size: 3
          }
        }) satisfies uPlot.Series)
    ],
    axes: [
      {
        stroke: "rgba(255, 255, 255, 0.5)",
        grid: {stroke: "rgba(255, 255, 255, 0.025)"},
        // values: ((self, splits) => splits.map(s => new Date(s))) satisfies uPlot.Axis.Values

      },
      {
        stroke: "rgba(255, 255, 255, 0.5)",
        grid: {stroke: "rgba(255, 255, 255, 0.025)"},
      }
    ]
    /*chart: {
      type: 'area',
      stacked: false,
      height: browser ? document.documentElement.clientHeight / 1.5 : undefined,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: 'zoom'
      },
      animations: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      }
    },
    yaxis: {
      labels: {
        formatter: (n: number) => {
          return commas(Math.round(n));
        }
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
      theme: 'dark',
      shared: true,
      y: {
        formatter: (n: number) => {
          if (n > 500000) {
            return '>500,000 sph';
          } else {
            return commas(n, 2) + ' sph';
          }
        }
      },
      x: {
        formatter: function (val: number) {
          const date = new Date(val);
          return (
            date.toLocaleDateString(undefined, { dateStyle: 'medium' }) +
            ' ' +
            date.toLocaleTimeString(undefined, { timeStyle: 'short', hour12: getTimePreference() })
          );
        }
      }
    },
    grid: {
      borderColor: '#535A6C'
    }*/
  });

  let mounted = $state(false);
  onMount(async () => {
    setTimeout(() => mounted = true, 1);
  });
</script>

<div style="min-height: 69vh w-full max-w-full" bind:this={wrapperDiv}>
  {#if mounted}
    <div in:fade>
      <UplotSvelte {data} {options} onCreate={() => {}} onDelete={() => {}}/>
    </div>
  {/if}
</div>
<small class="opacity-70">
  sph = sales per hour
</small>
<!--{JSON.stringify(stockHistory)}-->

