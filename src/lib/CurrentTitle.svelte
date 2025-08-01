<script lang="ts">
  import type { AggregateResponse } from "../routes/api/(live-statuses)/aggregate/+server.ts";
  import { dev } from "$app/environment";
  import { getClosestWan, isNearWan } from "$lib/timeUtils.ts";
  import {slide} from "svelte/transition";

  export let liveStatus: AggregateResponse | undefined;

  $: isCurrent = isNearWan() && liveStatus?.floatplane?.title?.includes(getClosestWan().toLocaleDateString(undefined, {dateStyle: "long"})) && !liveStatus.floatplane.title.includes("Hello Floatplane");
  let strippedTitle: string | undefined = undefined;
  $: {
    const splitPoint = " - WAN Show";
    const parts = liveStatus?.floatplane?.title.split(splitPoint);
    parts?.pop();
    strippedTitle = parts?.join(splitPoint);
  }

</script>

{#if isCurrent}
  <div transition:slide={{duration: 2e3}}>
    <div class="card py-1 px-3 mt-2 inline-block countdown-box text-left">
      <div class="text-xs opacity-50 relative bottom-1/2" style="height: 0.7em">
        Current Show Title
      </div>
      {strippedTitle}
    </div>
  </div>
{/if}