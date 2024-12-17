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
  let lastInvalidate = Date.now();
  let tries = 0;

  $: isDataOutdated = data.floatplane?.isLive !== ($page.url.searchParams.has("live") ? $page.url.searchParams.get("live") === "true" : data.floatplane?.isLive);

  onMount(() => {
    let i = setInterval(() => {


      if(
        // refresh if the detected status from extension is not what we have
        isDataOutdated ||
        // the extension should automatically reload us when the status changes, but re-check every hour anyway
        (!document.hidden && Date.now() - lastInvalidate > 60 * 60e3)
      ) {
        let delay = 0;
        if(tries > 10) delay = 30;
        if(tries > 20) delay = 60;
        if(tries > 30) delay = 2 * 60;
        if(tries > 40) delay = 5 * 60;
        if(tries > 50) delay = 15 * 60;
        if(Date.now() - lastInvalidate > delay * 1e3 && (tries < 30 || !document.hidden)) {
          console.debug("[whenplane live status frame] Re-fetching data")
          invalidateAll();
          lastInvalidate = Date.now();
        }
      } else {
        tries = 0;
      }

      updateLiveStatusChangeTime();
    }, 5e3)

    return () => clearInterval(i);
  })

  updateLiveStatusChangeTime()

  function updateLiveStatusChangeTime() {
    const distance = Date.now() - (liveStatusChangedDate ?? initialLiveStatusChangedDate).getTime();
    const initial = timeString(distance, true)?.split(" ");
    if(distance > 60e3) {
      initial?.pop();
      initial?.pop();
      initial?.pop();
      initial?.pop();
    }
    liveStatusChangeTime = initial?.join(" ") ?? "";
  }

</script>

<div class="inline-block p-2 relative h-full content-center">
  <span class:opacity-30={isDataOutdated}>
    <span class:green={data.floatplane?.isLive}>
      {data.floatplane?.isLive ? "Live" : "Offline"}
    </span>
    for {liveStatusChangeTime}
  </span>
  {#if isDataOutdated}
    <div class="absolute top-2.5 left-6">
      <ProgressRadial class="inline-block" width="w-5" stroke={250}/>
    </div>
  {/if}
</div>

<style>
    .green {
        color: lawngreen;
    }

    :global(body,html) {
        overflow: hidden;
    }
</style>