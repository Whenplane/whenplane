<script lang="ts">
  import type { NotablePeopleShortResponse } from "../routes/api/(live-statuses)/notable-streams/+server.ts";
  import { onMount } from "svelte";
  import { timeString } from "$lib/timeUtils.ts";

  export let shortResponse: NotablePeopleShortResponse;

  onMount(() => {
    const i = setInterval(updateDuration, 30e3);
    updateDuration()
    return () => clearInterval(i);
  })

  let duration = "";

  function updateDuration() {
    if(shortResponse.isLive && shortResponse.started) {
      const distance = Math.floor(Date.now() - new Date(shortResponse.started).getTime());
      const string = timeString(distance);
      const parts = string?.split(" ");
      if(parts?.pop() == "") parts?.pop(); // remove seconds
      duration = parts?.join(" ") ?? "";
    } else {
      duration = "";
    }
  }
  updateDuration();
</script>

<a class="card border-2 p-2 !border-amber-600 !bg-opacity-20 !bg-amber-600 block relative" href="https://twitch.tv/{shortResponse.channel}" target="_blank" rel="noopener">
  <div class="absolute top-2 right-2 opacity-60">
    {#if duration}
      Live for {duration}
    {/if}
  </div>
  <img src="/profiles/{shortResponse.name.toLowerCase()}.webp" class="inline-block placeholder-circle h-32" alt="{shortResponse.name}">
  <div class="inline-flex h-32 items-center justify-center ml-4">
    <div>
      <h2>{shortResponse.name} is live!</h2>
      {shortResponse.title}<br>
      <span class="opacity-80">
        {shortResponse.game}
      </span>
    </div>
  </div>
</a>