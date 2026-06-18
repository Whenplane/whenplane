<script lang="ts">
	import { page } from '$app/state';
	import { Currencies } from 'currencies-map';
	import type { LatestExchangeRate } from '../../routes/api/exchangeRates/exchangeRateAPITypes.ts';

	let {
    price,
    convert,
    currency: providedCurrency
  }: {
    price: number,
    convert?: boolean,
    currency?: string | false
  } = $props();

	let currency: string = $derived(providedCurrency || page.data.currency);

	let symbol = $derived(Currencies.symbols.get(currency));

	let exchangeRates: LatestExchangeRate = $derived(page.data.exchangeRates);

	let convertedPrice = $derived(convert ? price * exchangeRates.rates[currency] : price);
</script>

{symbol}{(Math.round(convertedPrice * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
