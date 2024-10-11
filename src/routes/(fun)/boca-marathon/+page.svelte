<script lang="ts">

  import NotablePersonLive from "$lib/NotablePersonLive.svelte";

  export let data;

  const initialReloadNumber = data.reloadNumber;
  let nowish = Date.now()

  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import DateStamp from "$lib/DateStamp.svelte";
  import { timeString } from "$lib/timeUtils.ts";

  let modifiedEvents: {event_name: string, event_timestamp: number, length: number, ended?: number, current: boolean}[] = [];
  $: {
    modifiedEvents = [];
    for (let i = 0; i < data.pastData.length; i++) {
      const thisEvent = data.pastData[i];
      const nextEvent = data.pastData[i-1];

      modifiedEvents.push({
        event_name: thisEvent.event_name,
        event_timestamp: thisEvent.event_timestamp,
        length: nextEvent ? nextEvent.event_timestamp - thisEvent.event_timestamp : Date.now() - thisEvent.event_timestamp,
        ended: nextEvent ? nextEvent.event_timestamp : undefined,
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
      nowish = Date.now();
    }, 1e3)
    return () => {
      clearInterval(i);
      clearInterval(ii);
    }
  })
</script>
<svelte:head>
  <title>BocaBola Game Marathon</title>
  <meta name="description" content="BocaBola Game Marathon tracker" />
</svelte:head>
<div class="container mx-auto p-2 pt-12 pb-32">
  <h1>BocaBola Game Marathon</h1>
  <br>
  {#if data.liveData.isLive}
    <div class="max-w-5xl mx-auto">
      <NotablePersonLive shortResponse={data.liveData}/>
    </div>
    <br>
  {/if}
  <br>
  <h2>Games Played</h2>
  {#each modifiedEvents as event}
    {@const epochSeconds = event.event_timestamp/1e3}
    {#if event.event_name.startsWith("start_")}
      {@const game = event.event_name.substring("start_".length)}
      <div class="flex">
        <img src="/games/{encodeURI(game.replaceAll(':', ''))}.webp" width="264" height="352" alt={game} class="game-image" class:just-chatting={game === "Just Chatting"}>
        <span class="content-center p-2">
          <span class="text-2xl">
            {game}
          </span><br>
          started <DateStamp {epochSeconds}/>{event.ended ? "," : "."}
          {#if event.ended}
            ended <DateStamp epochSeconds={event.ended/1e3}/>
          {/if}
          <br>
          {event.current ? "Playing" : "Played"} for {timeString(event.length)}
      </span>
      </div>
    {:else if event.event_name === "streamStart"}
      Stream started <DateStamp {epochSeconds}/> ({timeString(nowish - event.event_timestamp)?.trim()})
    {:else if event.event_name === "timerStart"}
      Marathon timer started <DateStamp {epochSeconds}/> ({timeString(nowish - event.event_timestamp)?.trim()})
    {:else}
      Unknown event {event.event_name} <DateStamp {epochSeconds}/>
    {/if}
    <br>
  {/each}
</div>

<!--<pre>{JSON.stringify(data, undefined, '\t')}</pre>-->

<style>
  .game-image {
      width: auto;
      max-width: 10em;
  }
  .just-chatting {
      object-fit: cover;
      aspect-ratio: 2/1;
  }
</style>