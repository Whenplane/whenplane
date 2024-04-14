<script lang="ts">
  import {onMount} from "svelte";
  import {shortMonths, isSameDay, yesterday} from "$lib/timeUtils";

  export let epochSeconds: number;

  let date = new Date(epochSeconds * 1000);

  let secondsAgo: number;
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
</script>
<span title="{shortMonths[date.getMonth()]} {date.getDate()}, {date.getFullYear()} at {date.toLocaleTimeString(undefined, {timeStyle: 'medium'})}">
    {#if secondsAgo < 60 * 60}
        {Math.round(secondsAgo / 60)} minutes ago
    {:else if isSameDay(new Date(), date)}
        Today at {date.toLocaleTimeString(undefined, {timeStyle: "short"})}
    {:else if isSameDay(yesterday(), date)}
        Yesterday at {date.toLocaleTimeString(undefined, {timeStyle: "short"})}
    {:else}
        {shortMonths[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
    {/if}
</span>