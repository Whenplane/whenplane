<script lang="ts">

  import NotablePersonLive from "$lib/NotablePersonLive.svelte";

  export let data;

  const initialReloadNumber = data.reloadNumber;

  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import DateStamp from "$lib/DateStamp.svelte";
  import { timeString } from "$lib/timeUtils.ts";

  let modifiedEvents: {event_name: string, event_timestamp: number, length: number, current: boolean}[] = [];
  $: {
    modifiedEvents = [];
    for (let i = 0; i < data.pastData.length; i++) {
      const thisEvent = data.pastData[i];
      const nextEvent = data.pastData[i-1];

      modifiedEvents.push({
        event_name: thisEvent.event_name,
        event_timestamp: thisEvent.event_timestamp,
        length: nextEvent ? nextEvent.event_timestamp - thisEvent.event_timestamp : Date.now() - thisEvent.event_timestamp,
        current: !nextEvent
      })

    }
  }


  onMount(() => {
    let i = setInterval(async () => {
      await invalidateAll();
      if(data.reloadNumber !== initialReloadNumber) location.href = ""
    }, 15e3);
    let ii = setInterval(() => {
      modifiedEvents = modifiedEvents.map(e => {
        if(!e.current) return e;
        return {
          ...e,
          length: e.length + 1
        }
      })
    }, 1e3)
    return () => {
      clearInterval(i);
      clearInterval(ii);
    }
  })
</script>
{#if data.liveData.isLive}
  <NotablePersonLive shortResponse={data.liveData}/>
{/if}
{#each modifiedEvents as event}
  {@const epochSeconds = event.event_timestamp/1e3}
  {#if event.event_name.startsWith("start_")}
    {@const game = event.event_name.substring("start_".length)}
    {game} started <DateStamp {epochSeconds}/>. {event.current ? "Playing" : "Played"} for {timeString(event.length)}
  {:else if event.event_name === "streamStart"}
    Stream started <DateStamp {epochSeconds}/>
  {:else if event.event_name === "timerStart"}
    Marathon timer started <DateStamp {epochSeconds}/>
  {:else}
    Unknown event {event.event_name} <DateStamp {epochSeconds}/>
  {/if}
  <br>
{/each}

<pre>{JSON.stringify(data, undefined, '\t')}</pre>