<script lang="ts">
  import LTTTime from "$lib/LTTTime.svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";

  $: isFrame = $page.url.searchParams.has("frame");

  if(browser && isFrame) {
    document.body.classList.add("background-none")
  }
</script>
<svelte:head>
  <title>LTT Time</title>
  <meta name="description" content="What time is it for LTT?">
</svelte:head>

<div class="flex h-screen items-center justify-center" class:bigtext={!isFrame}>
  <LTTTime border={isFrame} tooltip={!isFrame}/>
</div>

<style>
  .bigtext {
      font-size: 10em;
  }
</style>