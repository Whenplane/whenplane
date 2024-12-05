<script lang="ts">

  import { random } from "$lib/utils.ts";
  import PushNotifAd from "$lib/ads/PushNotifAd.svelte";
  import ExtensionAd from "$lib/ads/ExtensionAd.svelte";
  import { dev } from "$app/environment";
  import SearchAd from "$lib/ads/SearchAd.svelte";

  const count = 2
  export const choice = dev ? 3 : random(0, count+1, true);
</script>
{#if choice === 0}
  <!-- no ad -->
{:else if choice === 1}
  <ExtensionAd/>
{:else if choice === 2}
  <PushNotifAd/>
{:else if choice === 3}
  <SearchAd/>
{:else}
  Invalid choice!
{/if}