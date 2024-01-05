<script>
  import LTTTime from "$lib/LTTTime.svelte";
</script>
<svelte:head>
  <title>LTT Time</title>
  <meta name="description" content="What time is it for LTT?">
</svelte:head>

<div class="flex h-screen items-center justify-center">
  <LTTTime border={false}/>
</div>

<style>
  div {
      font-size: 10em;
  }
</style>