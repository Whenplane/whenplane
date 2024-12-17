<script lang="ts">
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { timeString } from "$lib/timeUtils.ts";
  import { page } from "$app/stores";
  import { ProgressRadial } from "@skeletonlabs/skeleton";

  export let data;

  $: liveStatusChangedDate = new Date(data.floatplane?.started ?? data.floatplane?.lastLive)
  let initialLiveStatusChangedDate = new Date(data.floatplane?.started ?? data.floatplane?.lastLive)


  let liveStatusChangeTime = "";
  let distance = 0;
  let lastInvalidate = Date.now();
  let tries = 0;

  $: isDataOutdated = data.floatplane?.isLive !== ($page.url.searchParams.has("live") ? $page.url.searchParams.get("live") === "true" : data.floatplane?.isLive);

  let intervalCounter = 0;

  onMount(() => {
    let i = setInterval(() => {
      intervalCounter++;
      // only update every 5 seconds when the distance is more than an hour
      if(!isDataOutdated && distance > 60e3 && intervalCounter % 5 !== 0) return;


      if(
        // refresh if the detected status from extension is not what we have
        isDataOutdated ||
        // the extension should automatically reload us when the status changes, but re-check every hour anyway
        (!document.hidden && Date.now() - lastInvalidate > 60 * 60e3)
      ) {
        let delay = 2;
        if(tries > 10) delay = 30;
        if(tries > 20) delay = 60;
        if(tries > 30) delay = 2 * 60;
        if(tries > 40) delay = 5 * 60;
        if(tries > 50) delay = 15 * 60;
        if(Date.now() - lastInvalidate >= delay * 1e3 && (tries < 10 || !document.hidden || Math.random() < 0.10)) {
          console.debug("[whenplane live status frame] Re-fetching data")
          invalidateAll();
          lastInvalidate = Date.now();
          tries++;
        }
      } else {
        tries = 0;
      }

      updateLiveStatusChangeTime();
    }, 1e3)

    return () => clearInterval(i);
  })

  updateLiveStatusChangeTime();

  function updateLiveStatusChangeTime() {
    distance = Date.now() - (liveStatusChangedDate ?? initialLiveStatusChangedDate).getTime();
    const initial = timeString(distance, true)?.split(" ");
    if(distance >= 60e3) {
      initial?.pop();
      initial?.pop();
      initial?.pop();
      initial?.pop();
    }
    liveStatusChangeTime = initial?.join(" ") ?? "";
  }

</script>

<a href="/floatplane" target="_blank" class="hidden-link">
  <div class="inline-block h-full content-center">
    <div class="relative px-2">
    <span class:opacity-30={isDataOutdated}>
      <span class:green={data.floatplane?.isLive}>
      {data.floatplane?.isLive ? "Live" : "Offline"}
    </span>
    for {liveStatusChangeTime}
    </span>
      {#if isDataOutdated}
        <div class="absolute top-0.5 left-6">
          <ProgressRadial class="inline-block" width="w-5" stroke={250}/>
        </div>
      {/if}
    </div>
  </div>
</a>

<style>
    .green {
        color: lawngreen;
    }

    :global(body,html) {
        overflow: hidden;
    }
</style>