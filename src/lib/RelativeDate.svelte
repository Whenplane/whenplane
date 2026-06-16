<script lang="ts">
  import { onMount } from 'svelte';
  import { shortMonths, isSameDay, yesterday } from '$lib/timeUtils';

  import { getTimePreference } from '$lib/prefUtils.ts';
  import { typed } from '$lib';

  let { epochSeconds = typed<number>() } = $props();

  let nowish = $state(new Date());
  let date = $derived(new Date(epochSeconds * 1000));
  let secondsAgo: number = $derived((nowish.getTime() / 1000) - epochSeconds);

  onMount(() => {
    let i: number;
    if (secondsAgo < 60 * 60) {
      i = setInterval(() => {
        nowish = new Date();
      }, 15e3) as unknown as number;
    } else if (isSameDay(new Date(), date) || isSameDay(yesterday(), date)) {
      i = setInterval(() => {
        nowish = new Date();
      }, 60e3) as unknown as number;
    }

    return () => clearInterval(i);
  });
</script>

<span
  title="{shortMonths[date.getMonth()]} {date.getDate()}, {date.getFullYear()} at {
		date.toLocaleTimeString(undefined, {
			timeStyle: 'medium',
			hour12: getTimePreference()
		})
	}"
>
	{#if secondsAgo < 30}
		a few seconds ago
	{:else if secondsAgo < 60 * 60}
		{Math.round(secondsAgo / 60)} minute{Math.round(secondsAgo / 60) === 1 ? '' : 's'} ago
	{:else if secondsAgo < 60 * 60 * 24}
		{Math.round(secondsAgo / 60 / 60)} hour{Math.round(secondsAgo / 60 / 60) === 1 ? '' : 's'} ago
	{:else}
		{Math.round(secondsAgo / 60 / 60 / 24)} day{Math.round(secondsAgo / 60 / 60 / 24) === 1 ? '' : 's'} ago
	{/if}
</span>
