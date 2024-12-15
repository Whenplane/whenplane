<script lang="ts">
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { timeString } from "$lib/timeUtils.ts";

  export let data;

  $: liveStatusChangedDate = new Date(data.floatplane?.started ?? data.floatplane?.lastLive)
  let initialLiveStatusChangedDate = new Date(data.floatplane?.started ?? data.floatplane?.lastLive)


  let liveStatusChangeTime = "";
  let lastInvalidate = 0;

  onMount(() => {
    let i = setInterval(() => {
      if(!document.hidden) {
        invalidateAll();
        lastInvalidate = Date.now();
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

<div class="inline-block p-2">
  <span class:green={data.floatplane?.isLive}>
    {data.floatplane?.isLive ? "Live" : "Offline"}
  </span>
  for {liveStatusChangeTime}
</div>

<style>
    .green {
        color: lawngreen;
    }
</style>