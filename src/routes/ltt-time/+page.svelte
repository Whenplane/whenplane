<script lang="ts">
  import LTTTime from "$lib/LTTTime.svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import {fade} from "svelte/transition";

  $: isFrame = $page.url.searchParams.has("frame");

  $: if(browser && isFrame) {
    document.body.classList.add("background-none")
  }

  let mounted = false;
  onMount(() => mounted = true)
</script>
<svelte:head>
  <title>LTT Time</title>
  <meta name="description" content="What time is it for LTT?">
</svelte:head>

{#if isFrame ? mounted : true}
  <div class="flex h-screen items-center justify-center" class:bigtext={!isFrame} in:fade>
    <LTTTime border={isFrame} tooltip={!isFrame}/>
  </div>
{/if}

<style>
  .bigtext {
      font-size: 10em;
  }
</style>