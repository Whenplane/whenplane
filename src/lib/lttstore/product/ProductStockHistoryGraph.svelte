<script lang="ts">
	import { run } from 'svelte/legacy';

	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { commas } from '$lib/utils.ts';
	import { fade } from 'svelte/transition';
	import { getTimePreference } from '$lib/prefUtils.ts';
	import type { StockCounts } from '$lib/lttstore/lttstore_types.ts';
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
		chartUpdateNumber = typed<number>(1)
	} = $props();

	let chart = $state();

	let onlyTotalCheck = $state(false);

	function getSeries() {
		if (!onlyTotal) {
			return Object.keys(someStock).map((k) => {
				return {
					name: k,
					data: stockHistory.map((h) => {
						return {
							x: h.timestamp,
							y: JSON.parse(h.stock)[k]
						};
					})
				};
			});
		} else {
			return [
				{
					name: 'total',
					data: stockHistory.map((h) => {
						return {
							x: h.timestamp,
							y: JSON.parse(h.stock)['total']
						};
					})
				}
			];
		}
	}

	const options = $state({
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
	});

	let chartDiv: HTMLDivElement = $state();

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
	let onlyTotal = $derived(Object.keys(someStock).length <= 2 || onlyTotalCheck);
	run(() => {
		console.debug({ onlyTotal, length: Object.keys(someStock).length, someStock, stockHistory });
	});
	run(() => {
		onlyTotal;
		chartUpdateNumber;
		options.series = getSeries();
		// console.debug("Series:", options.series)
		if (chart) chart.updateSeries(options.series);
	});
</script>

<div style="min-height: 69vh">
	{#if mounted}
		<div bind:this={chartDiv} in:fade></div>
	{/if}
</div>
{#if Object.keys(someStock).length > 2}
	<label>
		<input type="checkbox" bind:checked={onlyTotalCheck} />
		Only show total in graph?
	</label>
{/if}
<!--{JSON.stringify(stockHistory)}-->
