<script lang="ts">
	import { onMount } from 'svelte';
	import { commas } from '$lib/utils.ts';
	import { fade } from 'svelte/transition';
	import type { ParsedStockHistoryTableRow, StockCounts, StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";
	import { typed } from '$lib';
	import UplotSvelte from 'uplot-svelte';
	import uPlot from "uplot";
	import 'uplot/dist/uPlot.min.css';
	import { stockGaps, timeFormat, stockColors } from './ProductStockHistoryGraph.svelte';

	let {
		productName = typed<string | undefined>(),
		stockHistory: stockHistoryRaw = typed<StockHistoryTableRow[]>(),
		chartUpdateNumber = typed<number>(1)
	} = $props();

	let wrapperDiv = $state<HTMLDivElement>();

	let stockHistory: ParsedStockHistoryTableRow[] = $derived((stockHistoryRaw as StockHistoryTableRow[])
		.map(h => ({
			...h,
			stock: JSON.parse(h.stock)
		}))
		.toSorted((a, b) => a.timestamp - b.timestamp)
	);

	let someStock = $derived(
		Object.keys(stockHistory).length >= 1
			? stockHistory
				.map((h) => h.stock)
				.reduce((p, c) => {
					return {
						...c,
						...p
					};
				}, {})
			: {}
	);

	let onlyTotalCheck = $state(false);
	// show only the total for items where the stock is just the default + the total
	let onlyTotal = $derived(Object.keys(someStock).length <= 2 || onlyTotalCheck);

  let data = $derived.by(() => {
		return [
			[
				...stockHistory.map((h, i) => i === 0
					? Math.round(h.timestamp / 1e3)
					: Math.round((stockHistory[i-1].timestamp + h.timestamp) / 2 / 1e3)
				),
				...(stockHistory.length > 1 ? [stockHistory[stockHistory.length-1].timestamp] : []),
			],
			...(onlyTotal ? ["total"] : Object.keys(someStock))
				.map(k => stockHistory.map((h, i, a) => {
					if(i > 0) {
						const previous = a[i-1];
						const previousStock = previous.stock[k]
						const currentStock = h.stock[k];
						if(previousStock === null || currentStock === null) return null;
						const timeDiff = h.timestamp - previous.timestamp;
						const stockDiff = previousStock - currentStock;
						const rate = stockDiff / (timeDiff / (60 * 60e3));
						if(rate < 0) return null;
						return rate;
					} else {
						return null;
					}
				}))
		]
	});

	let width = $derived(wrapperDiv?.clientWidth ?? 1490);
	let height = $derived(width / 2);

	const resizeObserver = new ResizeObserver(() => {
		const newWidth = wrapperDiv?.clientWidth ?? 1490;
		setTimeout(() => {
			if(newWidth === (wrapperDiv?.clientWidth ?? 1490)) {
				width = newWidth;
			}
		}, 100);
	});
	$effect(() => wrapperDiv && resizeObserver.observe(wrapperDiv));

	const options: uPlot.Options = $derived({
		title: productName ? 'Move Rate History - ' + productName : 'Move Rate History',
		id: productName + "-move-rate-" + chartUpdateNumber,
		width,
		height,
		class: "max-w-full",
		series: [
			{
				label: "Time",
				value: timeFormat,
			},
			...(onlyTotal ? ["total"] : Object.keys(someStock))
				.map((k, i) => ({
					show: true,
					gaps: stockGaps,
					label: k,
					value: (_, rawValue: number | null) => rawValue === null ? "" : commas(Math.round(rawValue * 100) / 100)! + " sph",
					stroke: stockColors[i % stockColors.length],
					points: {
						show: false
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
{#if Object.keys(someStock).length > 2}
	<label>
		<input type="checkbox" bind:checked={onlyTotalCheck} />
		Only show total in graph?
	</label>
{/if}
<small class="opacity-70">
  sph = sales per hour
</small>
<!--{JSON.stringify(stockHistory)}-->

