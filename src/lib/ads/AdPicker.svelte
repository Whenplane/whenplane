<script lang="ts">

  import { random } from "$lib/utils.ts";
  import PushNotifAd from "$lib/ads/PushNotifAd.svelte";
  import ExtensionAd from "$lib/ads/ExtensionAd.svelte";

  const count = 2
  export const choice = random(1, count+1, true);
</script>
{#if choice === 1}
  <ExtensionAd/>
{:else if choice === 2}
  <PushNotifAd/>
{:else}
  Invalid choice!
{/if}