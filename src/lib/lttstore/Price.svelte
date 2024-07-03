<script lang="ts">
  import { page } from "$app/stores";
  import { Currencies } from "currencies-map";
  import type { LatestExchangeRate } from "../../routes/api/exchangeRates/exchangeRateAPITypes.ts";

  export let usd: number;

  let currency: string;
  $: currency = $page.data.currency;
  $: symbol = Currencies.symbols.get(currency);

  let exchangeRates: LatestExchangeRate;
  $: exchangeRates = $page.data.exchangeRates;

  $: convertedPrice = usd * exchangeRates.rates[currency];
</script>
{symbol}{(Math.round(convertedPrice * 100)/100).toLocaleString(undefined, {minimumFractionDigits: 2})}
