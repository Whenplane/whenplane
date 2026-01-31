<script lang="ts">
  import { run } from 'svelte/legacy';

  import {onMount} from "svelte";
  import {shortMonths, isSameDay, yesterday} from "$lib/timeUtils";

  import { getTimePreference } from "$lib/prefUtils.ts";

  interface Props {
    epochSeconds: number;
  }

  let { epochSeconds }: Props = $props();



  let secondsAgo: number = $state();
  function updateSecondsAgo() {
    secondsAgo = (new Date().getTime() / 1000) - epochSeconds;
  }
  updateSecondsAgo();

  onMount(() => {
    let i: number;
    if(secondsAgo < 60 * 60) {
      i = setInterval(() => {
        updateSecondsAgo();
      }, 15e3) as unknown as number;
    } else if(isSameDay(new Date(), date) || isSameDay(yesterday(), date)) {
      i = setInterval(() => {
        date = date; // tell svelte to re-evaluate isSameDay ifs below
      }, 60e3) as unknown as number;
    }

    return () => clearInterval(i);
  });
  let date = $derived(new Date(epochSeconds * 1000));
  run(() => {
      epochSeconds;
      updateSecondsAgo();
  });
</script>
<span title="{shortMonths[date.getMonth()]} {date.getDate()}, {date.getFullYear()} at {date.toLocaleTimeString(undefined, {timeStyle: 'medium', hour12: getTimePreference()})}">
    {#if secondsAgo < 30}
        a few seconds ago
    {:else if secondsAgo < 60 * 60}
        {Math.round(secondsAgo / 60)} minute{Math.round(secondsAgo / 60) === 1 ? "" : "s"} ago
    {:else if isSameDay(new Date(), date)}
        Today at {date.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
    {:else if isSameDay(yesterday(), date)}
        Yesterday at {date.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
    {:else}
        {shortMonths[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
    {/if}
</span>