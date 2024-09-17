<script lang="ts">
  import {timeString} from "$lib/timeUtils.ts";

  let frames = 250;
  let secondsPerFrame = 30;
  let currentFrame = 0;

  $: secondsLeft = (frames-currentFrame) * secondsPerFrame;
</script>

<div class="container mx-auto pt-24">
  <label>
    <span>Frames</span>
    <input class="input w-24" type="number" bind:value={frames}>
  </label>
  <br>
  <label>
    <span>Seconds per frame</span>
    <input class="input w-24" type="number" bind:value={secondsPerFrame}>
  </label>
  <label>
    <span>Current Frame</span>
    <input class="input w-24" type="number" bind:value={currentFrame}>
  </label>
  <br>
  <br>
  {timeString(secondsLeft * 1e3)} left
</div>