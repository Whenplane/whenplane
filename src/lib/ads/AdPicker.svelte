<script lang="ts">

  import { random } from "$lib/utils.ts";
  import PushNotifAd from "$lib/ads/PushNotifAd.svelte";
  import ExtensionAd from "$lib/ads/ExtensionAd.svelte";

  const count = 2
  export const choice = random(0, count+1, true);
</script>
{#if choice === 0}
  <!-- no ad -->
{:else if choice === 1}
  <ExtensionAd/>
{:else if choice === 2}
  <PushNotifAd/>
{:else}
  Invalid choice!
{/if}