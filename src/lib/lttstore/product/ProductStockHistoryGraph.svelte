<script module lang="ts">
	import uPlot from "uplot";
	import { getTimePreference } from '$lib/prefUtils.ts';
	const isNum = Number.isFinite;
	export const stockGaps: uPlot.Series.GapsRefiner = (u: uPlot, sidx: number, idx0: number, idx1: number, nullGaps: uPlot.Series.Gaps) => {
		let xData = u.data[0];
		let yData = u.data[sidx];

		let addGaps: uPlot.Series.Gaps = [];

		for (let i = idx0 + 1; i <= idx1; i++) {
			const now = yData[i];
			const previous = yData[i - 1];

			if (typeof now === "number" && typeof previous === "number" && isNum(now) && isNum(previous)) {
				if (now - previous > 7 * 24 * 60 * 60e3) {
					uPlot.addGap(
						addGaps,
						Math.round(u.valToPos(xData[i - 1], 'x', true)),
						Math.round(u.valToPos(xData[i], 'x', true)),
					);
				}
			}
		}

		nullGaps.push(...addGaps);
		nullGaps.sort((a, b) => a[0] - b[0]);

		return nullGaps;
	};

	export const stockColors = [
		"#008FFB",
		"#00E396",
		"#FFA500",
		"#FF4560",
		"#775DD0"
	]

	export const timeFormat: uPlot.Series.Value = ((_, val: number | null) => {
		if (val === null) return "";
		const date = new Date(val * 1e3);
		return (
			date.toLocaleDateString(undefined, { dateStyle: 'medium' }) +
			' ' +
			date.toLocaleTimeString(undefined, { timeStyle: 'short', hour12: getTimePreference() })
		)
	});
</script>
<script lang="ts">
	import { onMount } from 'svelte';
	import { commas } from '$lib/utils.ts';
	import { fade } from 'svelte/transition';
	import type { ProductOption, StockCounts, StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";
	import { typed } from '$lib';
	import UplotSvelte from 'uplot-svelte';
	import 'uplot/dist/uPlot.min.css';
	import { browser } from "$app/environment";

	let {
		productName = typed<string | undefined>(),
		stockHistory = typed<StockHistoryTableRow[]>(),
		productOptions = typed<ProductOption[]>(),
		chartUpdateNumber = typed<number>(1)
	} = $props();

	let wrapperDiv = $state<HTMLDivElement>();

	let onlyTotal = $state(false);
	let filter: string | undefined = $state(undefined);

	let someStock = $derived(
		Object.keys(stockHistory).length >= 1
			? stockHistory
				.map((h: { stock: string }) => JSON.parse(h.stock ?? '{}') as StockCounts)
				.reduce((p: StockCounts, c: StockCounts) => {
					return {
						...c,
						...p
					};
				}, {})
			: {}
	);
	$effect(() => console.debug({ onlyTotal, length: Object.keys(someStock).length, someStock, stockHistory }));
	let hideTotal = $derived.by(() => {
		const keys = [...Object.keys(someStock)];
		const totalIndex = keys.indexOf("total");
		if (totalIndex !== -1) {
			keys.splice(totalIndex, 1);
		}
		return keys.length == 1;
	});

	let data = $derived.by(() => {
		const filteredKeys = filter ? Object.keys(someStock).filter(k => k.includes(filter!)) : Object.keys(someStock);
		return [
			stockHistory.map((h: StockHistoryTableRow) => Math.round(h.timestamp / 1e3)),
			...(onlyTotal ? ["total"] : filteredKeys)
				.map((k: string) => stockHistory.map((h: { stock: string }) => {
					const stock = JSON.parse(h.stock)[k];
					return typeof stock === "number" ? stock : null;
				}))
		]
	});

	let width = $derived(wrapperDiv?.clientWidth ?? 1490);
	let height = $derived(width / 2);

	if(browser) {
		const resizeObserver = new ResizeObserver(() => {
			const newWidth = wrapperDiv?.clientWidth ?? 1490;
			setTimeout(() => {
				if (newWidth === (wrapperDiv?.clientWidth ?? 1490)) {
					width = newWidth;
				}
			}, 100);
		});
		$effect(() => wrapperDiv && resizeObserver.observe(wrapperDiv));
	}

	const options: uPlot.Options = $derived({
		title: productName ? 'Stock History - ' + productName : 'Stock History',
		id: productName + "-stock-history-" + chartUpdateNumber,
		width,
		height,
		class: "max-w-full",
		series: [
			{
				label: "Time",
				value: timeFormat,
			},
			...(onlyTotal ? ["total"] : (
				filter ? Object.keys(someStock).filter(k => k.includes(filter!)) :
					hideTotal ? Object.keys(someStock).filter(k => k !== "total") : Object.keys(someStock)
			))
				.map((k: string, i: number) => ({
					show: true,
					gaps: stockGaps,
					paths: uPlot.paths.spline?.(),
					label: k,
					value: (_, rawValue: number | null) => rawValue === null ? "" : commas(Math.round(rawValue))!,
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
				grid: { stroke: "rgba(255, 255, 255, 0.025)" },
			},
			{
				stroke: "rgba(255, 255, 255, 0.5)",
				grid: { stroke: "rgba(255, 255, 255, 0.025)" },
			}
		]
	});

	let mounted = $state(false);
	onMount(async () => {
		setTimeout(() => mounted = true, 1);
	});
</script>

<div style="min-height: 69vh w-full max-w-full" bind:this={wrapperDiv}>
	{#if mounted}
		<div in:fade>
			<UplotSvelte {data} {options} onCreate={() => {}} onDelete={() => {}} />
		</div>
	{/if}
</div>
{#if Object.keys(someStock).length > 2}
	<label class="inline-block">
		<input type="checkbox" bind:checked={onlyTotal} />
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
