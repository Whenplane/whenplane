<script>
  import { setCookie } from "$lib/cookieUtils";
  import { invalidateAll } from "$app/navigation";
  import ExclamationTriangle from "svelte-bootstrap-icons/lib/ExclamationTriangle.svelte";
  import {popup} from "@skeletonlabs/skeleton";
  import {fade} from "svelte/transition"

  export let data;

  let selectedCurrency = data.currency;
  $: if(selectedCurrency != data.currency) {
    setCookie("currency", selectedCurrency);
    invalidateAll();
  }

</script>
<div class="float-right pr-5 h-0">
  <div class="inline-block">
    {#if selectedCurrency !== "USD"}
      <span class="[&>*]:pointer-events-none" use:popup={{
        event: "hover",
        target: "currency-warning",
        placement: 'bottom'
      }} transition:fade={{duration: 150}}>
        <ExclamationTriangle class="inline-block text-yellow-300 h-7 w-7"/>
      </span>
    {/if}
    <select class="select w-20 p-1 pl-2 mt-8 sm:mt-1" bind:value={selectedCurrency}>
      {#each Object.entries(data.exchangeRates.rates) as [code, exchange] (code)}
        <option>{code}</option>
      {/each}
    </select>
  </div>
</div>
<slot/>
<br>
<div class="p-2">
  Images and products from <a href="https://lttstore.com/?ref=whenplane.com" class="anchor">lttstore.com</a><br>
</div>
<div class="card py-2 px-4" data-popup="currency-warning">
  <p>
    This currency conversion is only an estimate.<br>
    Conversion rates are only updated once per day,<br>
    and will probably <b>not</b> reflect the exact rate<br>
    used to charge you if you were to purchase.<br>
    <br>
    LTTStore charges only in USD.
  </p>
  <div class="arrow variant-filled-surface" />
</div>