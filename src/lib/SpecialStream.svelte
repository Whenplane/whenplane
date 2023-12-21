<script lang="ts">
  import { page } from "$app/stores";
  import type { SpecialStream } from "$lib/utils.ts";
  import SpecialStreamStatus from "$lib/subcomponents/SpecialStreamStatus.svelte";
  import { onMount } from "svelte";
  import { getTimeUntil } from "$lib/timeUtils.ts";

  export let specialStreamData: SpecialStream = $page.data.specialStream;

  let countdownString;
  let late = false;
  $: startTime = specialStreamData.start ? new Date(specialStreamData.start) : undefined;

  function updateCountdown() {
    if(!specialStreamData.start || !startTime) {
      if(countdownString) {
        countdownString = undefined;
      }
      return;
    }


    const timeUntil = getTimeUntil(startTime);

    countdownString = timeUntil.string;
    late = timeUntil.late
  }
  if(startTime) updateCountdown();

  onMount(() => {
    let interval = setInterval(updateCountdown, 1e3);
    return () => clearInterval(interval);
  })
</script>

<div class="card p-2 px-3 inline-block countdown-box text-left m-2 wrapper">
  <h2>Upcoming Stream</h2>
  <span class="title">
    "{specialStreamData.title}"
  </span><br>

  <table class="mx-auto my-1">
    <tr>
      <td>Floatplane:</td>
      <td><SpecialStreamStatus service="floatplane" {specialStreamData}/></td>
    </tr>
    <tr>
      <td>Twitch:</td>
      <td><SpecialStreamStatus service="twitch" {specialStreamData}/></td>
    </tr>
    <tr>
      <td>YouTube:</td>
      <td><SpecialStreamStatus service="youtube" {specialStreamData}/></td>
    </tr>
  </table>
  {#if countdownString}
    <h3 class="countdown">{countdownString}</h3>
  {/if}


</div>

<style>
    tr > td:first-child {
      padding-right: 1em;
      text-align: right;
    }

    .title {
        display: inline-block;
        font-size: 1.1em;
    }

    h3.countdown {
        font-family: monospace;
        text-align: center;
    }

    .wrapper {
        aspect-ratio: 16 / 9;
    }
</style>