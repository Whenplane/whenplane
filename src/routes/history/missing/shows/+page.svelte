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
  Note that most of these dates are from a while ago, so there might have just not been a show that week.<br>
  Also, some of these dates might be a day off. That's just because I'm lazy, ill fix it at some point.<br>
  <br>
  <b>If you find any of these, please tell me!</b> The easiest way to reach me is on discord: <code>ajgeiss0702</code><br>
  Either DM me or ping me in <code>#the-wan-show</code> in the
  <a href="https://discord.gg/ltt" target="_blank" rel="noopener">
    ltt discord
  </a>
  <br>
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