<script lang="ts">
  import {timeString} from "$lib/timeUtils.ts";

  let frames = 250;
  let secondsPerFrame: number | undefined = 30;
  let currentFrame = 0;
  let totalTime: number | undefined = undefined;

  let useTotalTime = false;

  $: if(useTotalTime) {
    secondsPerFrame = undefined;
    totalTime = 60 * 60;
  } else {
    totalTime = undefined;
    secondsPerFrame = 30;
  }
  $: console.log({useTotalTime})
  $: console.log({totalTime})

  $: secondsLeft = (frames-currentFrame) * (secondsPerFrame ?? ((totalTime ?? 0)/currentFrame));
</script>

<div class="container mx-auto pt-24">
  <label>
    <span>Frames</span>
    <input class="input w-24" type="number" bind:value={frames}>
  </label>
  <br>
  <label>
    <span>Use total time?</span>
    <input type="checkbox" bind:checked={useTotalTime}/>
  </label>
  <label>
    {#if useTotalTime}
      <span>Total time (seconds)</span>
      <input class="input w-24" type="number" bind:value={totalTime}>
    {:else}
      <span>Seconds per frame</span>
      <input class="input w-24" type="number" bind:value={secondsPerFrame}>
    {/if}
  </label>
  <label>
    <span>Current Frame</span>
    <input class="input w-24" type="number" bind:value={currentFrame}>
  </label>
  <br>
  <br>
  {timeString(secondsLeft * 1e3)} left
</div>