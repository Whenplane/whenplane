<script>
  import { setCookie } from "$lib/cookieUtils";
  import { invalidateAll } from "$app/navigation";

  export let data;

  let selectedCurrency = data.currency;
  $: if(selectedCurrency != data.currency) {
    setCookie("currency", selectedCurrency);
    invalidateAll();
  }

</script>
<div class="float-right pr-5 h-0">
  <select class="select w-20 p-1 pl-2 mt-8 sm:mt-1" bind:value={selectedCurrency}>
    {#each Object.entries(data.exchangeRates.rates) as [code, exchange] (code)}
      <option>{code}</option>
    {/each}
  </select>
</div>
<slot/>
<br>
<div class="p-2">
  Images and products from <a href="https://lttstore.com/?ref=whenplane.com" class="anchor">lttstore.com</a><br>
</div>