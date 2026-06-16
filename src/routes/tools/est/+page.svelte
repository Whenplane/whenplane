<script lang="ts">
  import { run } from 'svelte/legacy';

  import {timeString} from "$lib/timeUtils.ts";

  let frames = $state(250);
  let secondsPerFrame: number | undefined = $state(30);
  let currentFrame = $state(0);
  let totalTime: number | undefined = $state(undefined);

  let useTotalTime = $state(false);

  run(() => {
    if(useTotalTime) {
      secondsPerFrame = undefined;
      totalTime = 60 * 60;
    } else {
      totalTime = undefined;
      secondsPerFrame = 30;
    }
  });
  run(() => {
    console.log({useTotalTime})
  });
  run(() => {
    console.log({totalTime})
  });

  let timePerFrame = $derived(totalTime ? totalTime/currentFrame : undefined);

  let secondsLeft = $derived((frames-currentFrame) * (secondsPerFrame ?? timePerFrame ?? 0));
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
  {timeString(secondsLeft * 1e3)} left<br>
  {#if timePerFrame}
    {timeString(timePerFrame * 1e3)} per frame
  {/if}
</div>