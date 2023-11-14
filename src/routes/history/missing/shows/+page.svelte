<script lang="ts">
  import { page } from "$app/stores";

  export let data;
</script>

<svelte:head>
  <title>Missing shows</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/history">History</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/history/missing">Missing</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Shows</li>
</ol>

<div class="text-center">

  <h1>Possibly missing shows</h1>
  Dates listed here are dates that there <i>should</i> be a show, but whenplane doesnt know about it.<br>
  It would probably be missing due to the youtube api skipping some videos when I ask for a list for some reason.<br>
  Thanks youtube, very cool!<br>
  <br>
  Total missing shows: {data.missing.length}
  <br>
  <br>

  {#each data.missing as date}
    {date}<br>
  {:else}
    No missing shows!
  {/each}

</div>