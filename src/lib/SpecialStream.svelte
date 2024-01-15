<script lang="ts">
  import { page } from "$app/stores";
  import type { SpecialStream } from "$lib/utils.ts";
  import SpecialStreamStatus from "$lib/subcomponents/SpecialStreamStatus.svelte";
  import { onMount } from "svelte";
  import { getTimeUntil } from "$lib/timeUtils.ts";
  import Late from "$lib/Late.svelte";
  import { floatplaneState } from "$lib/stores.ts";

  export let specialStreamData: SpecialStream = $page.data.specialStream;

  let countdownString: string | undefined;
  let late = false;
  $: startTime = specialStreamData.start ? new Date(specialStreamData.start) : undefined;

  $: live = $floatplaneState?.live;

  $: thumbnailStyle = specialStreamData.thumbnail ? `background: linear-gradient(rgba(21,23,31,.75), rgba(21,23,31,.75)), url(${JSON.stringify(specialStreamData.thumbnail)});` : "";

  function updateCountdown() {
    if(!specialStreamData.start || !startTime) {
      if(countdownString) {
        countdownString = undefined;
      }
      return;
    }


    const timeUntil = getTimeUntil(startTime);

    countdownString = timeUntil.string;
    late = timeUntil.late;
  }

  $: updateCountdown(startTime)

  onMount(() => {
    let interval = setInterval(updateCountdown, 1e3);
    return () => clearInterval(interval);
  })
</script>

<div class="card inline-block countdown-box text-left m-2 wrapper" style={thumbnailStyle}>
  <div class="p-2 px-3 relative z-2">
    <h2>Special Stream</h2>
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
    {#if countdownString || live}
      <h3 class="countdown" class:red={late && !live} class:green={live}>
        {#if live}
          Currently Live
        {:else}
          {countdownString}
          {#if late && !live}
            <Late/>
          {/if}
        {/if}
      </h3>
    {/if}
  </div>

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
        margin-bottom: 0;
    }

    .wrapper {
        aspect-ratio: 16 / 9;
        display: inline-flex;
        align-items: center;

        overflow: hidden;

        /*background-blend-mode: overlay;*/
        background-size: contain !important;
    }

    .red {
        color: red;
    }
    .green {
        color: green;
    }
</style>