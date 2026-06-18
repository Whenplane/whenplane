<script lang="ts">

  import { deleteCookie, setCookie } from "$lib/cookieUtils";
  import { invalidateAll, onNavigate } from "$app/navigation";
  import ExclamationTriangle from "svelte-bootstrap-icons/lib/ExclamationTriangle.svelte";
  import {fade} from "svelte/transition"
  import ProductSearchModal from "../ProductSearchModal.svelte";
  import type { MouseEventHandler } from "svelte/elements";
  import { setContext } from "svelte";
  import { dev } from "$app/environment";
  import ToolTip from "$lib/ToolTip.svelte";

  let { data, children } = $props();

  let selectedCurrency = $state(data.currency);
  $effect(() => {
    if(selectedCurrency != data.currency) {
      if(selectedCurrency === data.store.defaultCurrency) {
        deleteCookie("currency");
      } else {
        setCookie("currency", selectedCurrency);
      }
      invalidateAll();
    }
  });
  onNavigate(() => {
    if(searchOpen) searchOpen = false;
  })
  $effect(() => console.debug({searchOpen}))

  let searchOpen = $state(false);

  setContext("lttstore-search-modal", () => searchOpen = true)

  function keypress(event: KeyboardEvent) {
    if(event.key === "P" && document.activeElement?.tagName !== "INPUT") {
      searchOpen = true;
    }
    if(searchOpen && event.key === "Escape") {
      searchOpen = false;
    }
  }

  let quickSearchSpanner: HTMLDivElement | undefined = $state();
  const bgClick: MouseEventHandler<HTMLDivElement> = e => {
    console.log(e.target, e.currentTarget);
    if(e.target === e.currentTarget || e.target === quickSearchSpanner) searchOpen = false;
  }

</script>
<svelte:window onkeyup={keypress}/>

{#if searchOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="bg-surface-900/80 fixed top-0 left-0 right-0 bottom-0 z-999" onclick={bgClick} role="alertdialog" tabindex="0">
    <div class="w-full h-full flex justify-center items-center" bind:this={quickSearchSpanner}>
      <ProductSearchModal/>
    </div>
  </div>
{/if}

<div class="float-right pr-5 h-0">
  <div class="inline-block">
    {#if selectedCurrency !== data.store.defaultCurrency}
      <div class="inline-block" transition:fade|global={{duration: 150}}>
        <ToolTip id="currency-mismatch">
          {#snippet icon()}
            <ExclamationTriangle class="inline-block text-yellow-300 h-[1.5em] aspect-square w-auto align-bottom" width="512" height="512"/>
          {/snippet}
          This currency conversion is only an estimate.<br>
          Conversion rates are only updated once per day,<br>
          and will probably <b>not</b> reflect the exact rate<br>
          used to charge you if you were to purchase.<br>
          (although it will probably be close)<br>
          <br>
          {data.store.storeName} LTTStore only charges in {data.store.defaultCurrency}.
          <br>
          1 {data.store.defaultCurrency} ≈ {data.exchangeRates.rates[selectedCurrency]} {selectedCurrency}
      </ToolTip>
      </div>
    {/if}
    <select class="select w-20 p-1 pl-2 mt-8 sm:mt-1 inline-block" bind:value={selectedCurrency}>
      {#each Object.keys(data.exchangeRates.rates) as code (code)}
        <option>{code}</option>
      {/each}
    </select>
  </div>
</div>
{@render children?.()}
<br>
<div class="p-4">
  Images and products from <a href="https://{data.store.subdomain}.lttstore.com/?ref=whenplane.com" class="anchor">lttstore.com</a><br>
  <span class="text-sm opacity-60">
    Whenplane and the Whenplane LTTStore Watcher is not affiliated with or endorsed by Linus Media Group.
  </span>
</div>
