<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { AggregateResponse } from "../routes/api/(live-statuses)/aggregate/+server.ts";
  import { getClosestWan, isLargeNearWan } from "$lib/timeUtils.ts";
  import {slide} from "svelte/transition";
  import {page} from "$app/state";

  interface Props {
    liveStatus: AggregateResponse | undefined;
  }

  let { liveStatus }: Props = $props();

  let isCurrent = $derived(isLargeNearWan() &&
    liveStatus?.floatplane?.title?.includes(getClosestWan(undefined, page.data.alternateStartTimes).toLocaleDateString(undefined, {dateStyle: "long"})) &&
    !liveStatus.floatplane.title.includes("Hello Floatplane"));
  let strippedTitle: string | undefined = $state(undefined);
  run(() => {
    const splitPoint = " - WAN Show";
    const parts = liveStatus?.floatplane?.title?.split(splitPoint);
    parts?.pop();
    strippedTitle = parts?.join(splitPoint);
  });

</script>

{#if isCurrent}
  <div transition:slide={{duration: 2e3}}>
    <div class="card py-1 px-3 mb-2 inline-block countdown-box text-left">
      <div class="text-xs opacity-50 relative" style="height: 0.7em; bottom: 0.15em;">
        Current Show Title
      </div>
      {strippedTitle}
    </div>
  </div>
{/if}