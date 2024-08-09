<script lang="ts">
  import { onMount } from "svelte";
  import {timeStringHours, timeString} from "$lib/timeUtils";
  import {ProgressBar} from "@skeletonlabs/skeleton";
  import Confetti from "svelte-confetti"
  import { dev } from "$app/environment";

  const totalTime = (150 * 60 * 60e3);
  // this is multiple lines, so I can easily comment/uncomment
  const startTime =
    dev ? Date.now() - totalTime + 2e3 :
      1722647766000;

  let string: string | undefined = "";
  let distance: number;

  function update() {
    distance = Math.min(Date.now() - startTime, totalTime);
    string = timeStringHours(distance);
  }

  update();

  onMount(() => {
    let i = setInterval(update, 1e3);
    return () => clearInterval(i);
  })
</script>
<svelte:head>
  <title>Boca Subathon Progress</title>
  <meta name="description" content="Boca subathon progress % and time remaining">
</svelte:head>

<div class="limit mx-auto pt-8 p-2">
  <h1>{string}</h1>
  into the subathon.
  <br>
  <br>

  <a href="https://twitch.tv/bocabola_">twitch.tv/bocabola_</a>

  <br>
  <br>
  The subathon is currently {((distance / totalTime) * 100).toFixed(3)}% complete.<br>
  <ProgressBar value={distance} max={totalTime} />
  <br>
  <br>
  There is
  <span class="font-mono">
    {timeString(totalTime - distance, true)?.trim()}
  </span>
  remaining.<br>
  {#if totalTime - distance > 24 * 60 * 60e3}
    aka
    <span class="font-mono">
      {timeStringHours(totalTime - distance)}
    </span>
  {/if}

  <div class="confetti-container">
    {#if distance >= totalTime}
      <Confetti delay={[0, 2000]} cone x={[-1.5, 1.5]} y={[0.25, 1.5]} amount={50} fallDistance="100px" iterationCount=infinite/>
      <Confetti delay={[0, 2000]} x={[-2.5, 2.5]} y={[0.75, 2.25]} amount={100} iterationCount=infinite/>
    {/if}
  </div>
</div>

<style>
  .confetti-container {
      position: fixed;
      top: 50%;
      left: 50%;
      /*margin-left: -50px;*/
      width: 5px;
      height: 5px;
  }
</style>