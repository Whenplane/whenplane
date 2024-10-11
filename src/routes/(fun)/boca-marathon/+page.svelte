<script lang="ts">

  import NotablePersonLive from "$lib/NotablePersonLive.svelte";

  export let data;

  const initialReloadNumber = data.reloadNumber;

  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import DateStamp from "$lib/DateStamp.svelte";

  onMount(() => {
    let i = setInterval(async () => {
      await invalidateAll();
      if(data.reloadNumber !== initialReloadNumber) location.href = ""
    }, 10e3);
    return () => clearInterval(i);
  })
</script>
{#if data.liveData.isLive}
  <NotablePersonLive shortResponse={data.liveData}/>
{/if}
{#each data.pastData as event}
  {@const epochSeconds = event.event_timestamp/1e3}
  {#if event.event_name.startsWith("start_")}
    {@const game = event.event_name.substring("start_".length)}
    {game} started <DateStamp {epochSeconds}/>
  {:else if event.event_name === "streamStart"}
    Stream started <DateStamp {epochSeconds}/>
  {:else}
    Unknown event {event.event_name} <DateStamp {epochSeconds}/>
  {/if}
  <br>
{/each}

<pre>{JSON.stringify(data, undefined, '\t')}</pre>