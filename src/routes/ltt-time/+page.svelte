<script lang="ts">
  import { run } from 'svelte/legacy';

  import LTTTime from "$lib/LTTTime.svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import {fade} from "svelte/transition";

  let isFrame = $derived($page.url.searchParams.has("frame"));
  let isBoca = $derived($page.url.searchParams.has("boca"))

  run(() => {
    if(browser && isFrame) {
      document.body.classList.add("background-none")
    }
  });

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
    if(isBoca) {
      history.replaceState(null, "", "/boca-time")
    }
  })
</script>
<svelte:head>
  <title>{isBoca ? "Boca" : "LTT"} Time</title>
  <meta name="description" content="What time is it for {isBoca ? 'Boca' : 'LTT'}?">
</svelte:head>

{#if isFrame ? mounted : true}
  <div class="flex h-screen items-center justify-center" class:bigtext={!isFrame} in:fade|global>
    <LTTTime border={isFrame} tooltip={!isFrame}/>
  </div>
{/if}

<style>
  .bigtext {
      font-size: 10em;
  }
</style>