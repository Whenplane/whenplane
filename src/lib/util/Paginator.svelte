<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { countTo } from "$lib/utils.ts";

  export let totalPages: number;
  export let currentPage = 40036;

  $: distance = Math.abs(currentPage - totalPages);


  const dispatch = createEventDispatcher();

  function page(pageNumber: number) {
    dispatch("page", {page: pageNumber});
  }
</script>
{#if currentPage > 1}
  {#if currentPage > 4}
    <button class="link" on:click={() => page(1)}>{1}</button>
    <button class="link" on:click={() => page(2)}>{2}</button>
    <button class="link" on:click={() => page(3)}>{3}</button>
    ..
    <button class="link" on:click={() => page(currentPage-2)}>{currentPage-2}</button>
    <button class="link" on:click={() => page(currentPage-1)}>{currentPage-1}</button>
  {:else}
    {#if currentPage > 0}
      {#each countTo(1, currentPage-1) as i}
        <button class="link" on:click={() => page(i)}>{i}</button>
        <span> </span> <!-- this has to be here, otherwise there is no space between the numbers -->
      {/each}
    {/if}
  {/if}
{/if}


<span class="px-2">
  {currentPage}
</span>


{#if currentPage < totalPages}
  {#if distance > 4}
    <button class="link" on:click={() => page(currentPage+1)}>{currentPage+1}</button>
    <button class="link" on:click={() => page(currentPage+2)}>{currentPage+2}</button>
    ..
  {:else}
    {#if distance > 0}
      {#each countTo(currentPage+1, totalPages-1) as i}
        <button class="link" on:click={() => page(i)}>{i}</button>
        <span> </span> <!-- this has to be here, otherwise there is no space between the numbers -->
      {/each}
    {/if}
  {/if}
  <button class="link" on:click={() => page(totalPages)}>{totalPages}</button>
{/if}


<style>
  button {
      --tw-text-opacity: 1;
      color: rgb(var(--color-primary-500) / var(--tw-text-opacity));
      text-decoration-line: underline;
      @apply px-2;
  }
  button:hover {
      --tw-brightness: brightness(1.1);
      filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
  }
</style>
