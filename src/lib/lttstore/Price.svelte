<script lang="ts">
  import { page } from "$app/state";
  import { Currencies } from "currencies-map";
  import type { LatestExchangeRate } from "../../routes/api/exchangeRates/exchangeRateAPITypes.ts";

  interface Props {
    usd: number;
  }

  let { usd }: Props = $props();

  let currency: string = $derived(page.data.currency);
  
  let symbol = $derived(Currencies.symbols.get(currency));

  let exchangeRates: LatestExchangeRate = $derived(page.data.exchangeRates);
  

  let convertedPrice = $derived(usd * exchangeRates.rates[currency]);
</script>
{symbol}{(Math.round(convertedPrice * 100)/100).toLocaleString(undefined, {minimumFractionDigits: 2})}
