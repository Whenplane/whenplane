<script module lang="ts">
  import uPlot from "uplot";
  const isNum = Number.isFinite;
  export const stockGaps: uPlot.Series.GapsRefiner = (u: uPlot, sidx: number, idx0: number, idx1: number, nullGaps: uPlot.Series.Gaps) => {
    let xData = u.data[0];
    let yData = u.data[sidx];

    let addGaps: uPlot.Series.Gaps = [];

    for (let i = idx0 + 1; i <= idx1; i++) {
      const now = yData[i];
      const previous = yData[i - 1];

      if (typeof now === "number" && typeof previous === "number" && isNum(now) && isNum(previous)) {
        // adds a gap if the gap is more than 7 days
        if (now - previous > 7 * 24 * 60 * 60e3) {
          uPlot.addGap(
            addGaps,
            Math.round(u.valToPos(xData[i - 1], 'x', true)),
            Math.round(u.valToPos(xData[i],     'x', true)),
          );
        }
      }
    }

    nullGaps.push(...addGaps);
    nullGaps.sort((a, b) => a[0] - b[0]);

    return nullGaps;
  };

  export const timeFormat: uPlot.Series.Value = ((_, val: number | null) =>  {
    if(val === null) return "";
    const date = new Date(val);
    return (
      date.toLocaleDateString(undefined, { dateStyle: 'medium' }) +
      ' ' +
      date.toLocaleTimeString(undefined, { timeStyle: 'short', hour12: getTimePreference() })
    )
  });

  export const stockColors = [
    "#008FFB",
    "#00E396",
    "orange",
    "#FF4560",
    "#775DD0"
  ]
</script>
<script lang="ts">
  import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { commas } from '$lib/utils.ts';
	import { fade } from 'svelte/transition';
	import { getTimePreference } from '$lib/prefUtils.ts';
  import type { ProductOption, StockCounts } from "$lib/lttstore/lttstore_types.ts";
	import { typed } from '$lib';

	let {
		productName = typed<string | undefined>(),
		stockHistory = typed<
			{
				handle: string;
				id: number;
				timestamp: number;
				stock: string;
			}[]
		>(),
    productOptions = typed<ProductOption[]>(),
		chartUpdateNumber = typed<number>(1)
	} = $props();

	let chart: ApexCharts | undefined = $state();
  let filter: string | undefined = $state(undefined);

	let onlyTotalCheck = $state(false);

  let someStock = $derived(
    Object.keys(stockHistory).length >= 1
      ? stockHistory
        .map((h) => JSON.parse(h.stock ?? '{}') as StockCounts)
        .reduce((p, c) => {
          return {
            ...c,
            ...p
          };
        }, {})
      : {}
  );
  // show only the total for items where the stock is just the default + the total
  let onlyTotal = $derived.by(() => {
    const keys = [...Object.keys(someStock)];
    const totalIndex = keys.indexOf("total");
    if (totalIndex !== -1) {
      keys.splice(totalIndex, 1);
    }
    // if only 1 after removing total, then its probably the default one
    return (keys.length == 1) || onlyTotalCheck;
  });
  $effect(() => console.debug({ onlyTotal, length: Object.keys(someStock).length, someStock, stockHistory }));

  function getSeries() {
    if(!onlyTotal) {
      return Object.keys(someStock)
        .filter(k => filter ? k.includes(filter) : true)
        .map(k => {
          return {
            name: k,
            data: stockHistory.map(h => {
              return {
                x: h.timestamp,
                y: JSON.parse(h.stock)[k]
              };
            }).filter(d => typeof d.y === "number")
          }
        })
    } else {
      return [{
        name: "total",
        data: stockHistory.map(h => {
          return {
            x: h.timestamp,
            y: JSON.parse(h.stock)["total"]
          };
        }).filter(d => typeof d.y === "number")
      }]
    }
  }

	const options = {
		chart: {
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
		series: {},
		dataLabels: {
			enabled: false
		},
		markers: {
			size: 0
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
			}
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
						return '>500,000';
					} else {
						return commas(n);
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
		}
	};


  $effect.pre(() => {
    onlyTotal;
    chartUpdateNumber;
    options.series = getSeries();
    // console.debug("Series:", options.series)
    if (chart) chart.updateSeries(options.series);
  })

	let chartDiv: HTMLDivElement | undefined = $state();

	let ApexCharts;
	let mounted = $state(false);
	onMount(async () => {
		options.series = getSeries();
		mounted = true;
		ApexCharts = (await import('apexcharts')).default;
		chart = new ApexCharts(chartDiv, options);
		chart.render();

		// console.log({options})
	});

	// let style = browser ?  : undefined;
</script>

<div style="min-height: 69vh">
	{#if mounted}
		<div bind:this={chartDiv} in:fade></div>
	{/if}
</div>
{#if Object.keys(someStock).length > 2}
	<label class="inline-block">
		<input type="checkbox" bind:checked={onlyTotalCheck} />
		Only show total in graph?
	</label>
{/if}
{#if productOptions.length > 1}
  {#if Object.keys(someStock).length > 2}
    &nbsp;
  {/if}
  <select bind:value={filter} class="select w-56 inline-block px-2 bg-surface-900">
    <option value={undefined}>All</option>
    {#each productOptions.sort((a, b) => a.position - b.position) as option}
      <optgroup label={option.name}>
        {#each option.values as value}
          <option {value}>{value}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
{/if}
<!--{JSON.stringify(stockHistory)}-->

