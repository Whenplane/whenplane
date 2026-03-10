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

