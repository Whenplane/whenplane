<script lang="ts">
  import { onMount } from "svelte";
  import {timeStringHours, timeString} from "$lib/timeUtils";
  import {ProgressBar} from "@skeletonlabs/skeleton";
  import Confetti from "svelte-confetti"
  import { dev } from "$app/environment";
  import { getDateFormatLocale } from "$lib/prefUtils.ts";
  import { updated } from "$app/stores";
  import { page } from "$app/stores";

  const totalTime = (168 * 60 * 60e3);
  // this is multiple lines, so I can easily comment/uncomment
  const startTime: number | undefined =
    // dev ? Date.now() - totalTime + 15e3 :
      undefined;

  const scheduledStart = new Date("2025-06-11T17:20:21.245Z");

  let string: string | undefined = $state("");
  let distance: number = $state();

  function update() {
    distance = Math.min(Date.now() - (startTime ?? scheduledStart.getTime()), totalTime);
    string = distance > 0 ? timeStringHours(distance) : timeString(Math.abs(distance));
    if(distance < 0) {
      string = string?.replaceAll(/[0-9]+(s|m|h)/g, "").trim();
    }
  }

  // this is needed because for some weird reason I can't check for an update without subscribing to the $updated store
  let updateAvailable = $derived($updated)

  update();

  onMount(() => {
    let i = setInterval(update, 1e3);
    let ri = setInterval(async () => {
      if(!document.hidden || Math.random() < 0.25) { // 25% chance of checking when we are hidden
        if(await updated.check()) location.href = "";
      }
    }, 30e3);
    return () => {
      clearInterval(i);
      clearInterval(ri);
    }
  })
</script>
<svelte:head>
  <title>Boca Subathon Progress</title>
  <meta name="description" content="Boca stream marathon progress % and time remaining">
  <link rel="canonical" href="https://whenplane.com{$page.url.pathname}"/>
</svelte:head>

<div class="limit mx-auto pt-8 p-2">
  <h1>{string}</h1>
  {#if distance > 0}
    into the week hour marathon.
  {:else}
    until the week-long streaming marathon is supposed to start on {scheduledStart.toLocaleDateString(getDateFormatLocale(), {dateStyle: "full"})}<br>
<!--    <small class="opacity-60">Date may change as it gets closer</small>-->
  {/if}
  <br>
  <br>

  <a href="https://twitch.tv/bocabola">twitch.tv/bocabola</a>

  <br>
  <br>
  {#if distance > 0}
    The subathon is currently {((distance / totalTime) * 100).toFixed(3)}% complete.<br>
    <ProgressBar value={distance} max={totalTime} />
    <br>
    <br>
    There are
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
