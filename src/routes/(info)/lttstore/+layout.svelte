<script lang="ts">
  import { run } from 'svelte/legacy';

  import { setCookie } from "$lib/cookieUtils";
  import { invalidateAll } from "$app/navigation";
  import ExclamationTriangle from "svelte-bootstrap-icons/lib/ExclamationTriangle.svelte";
  import { modalStore } from "@skeletonlabs/skeleton-svelte";
  import {fade} from "svelte/transition"
  import ProductSearchModal from "./ProductSearchModal.svelte";
  import DateStamp from "$lib/DateStamp.svelte";

  let { data, children } = $props();

  let selectedCurrency = $state(data.currency);
  run(() => {
    if(selectedCurrency != data.currency) {
      setCookie("currency", selectedCurrency);
      invalidateAll();
    }
  });

  function keypress(event: KeyboardEvent) {
    if(event.key === "P" && document.activeElement?.tagName !== "INPUT") {
      modalStore.trigger({
        type: 'component',
        component: {
          ref: ProductSearchModal
        }
      })
    }
  }

</script>
<svelte:window onkeyup={keypress}/>
<div class="float-right pr-5 h-0">
  <div class="inline-block">
    {#if selectedCurrency !== "USD"}
      <span class="*:pointer-events-none" use:popup={{
        event: "hover",
        target: "currency-warning",
        placement: 'bottom'
      }} transition:fade|global={{duration: 150}}>
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
{@render children?.()}
<br>
<div class="p-4">
  Images and products from <a href="https://www.lttstore.com/?ref=whenplane.com" class="anchor">lttstore.com</a><br>
  <span class="text-sm opacity-60">
    Whenplane and the Whenplane LTTStore Watcher is not affiliated with or endorsed by Linus Media Group.
  </span>
</div>
<div class="card py-2 px-4" data-popup="currency-warning">
  <p>
    This currency conversion is only an estimate.<br>
    Conversion rates are only updated once per day,<br>
    and will probably <b>not</b> reflect the exact rate<br>
    used to charge you if you were to purchase.<br>
    (although it will probably be close)<br>
    <br>
    The Whenplane LTTStore watcher gathers data from the US store, which charges only in USD. Prices on the global store <br>
    <br>
    1 USD ≈ {data.exchangeRates.rates[selectedCurrency]} {selectedCurrency}
  </p>
  <div class="arrow preset-filled-surface-500"></div>
</div>