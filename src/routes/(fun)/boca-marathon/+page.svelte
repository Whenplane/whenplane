<script lang="ts">

  import NotablePersonLive from "$lib/NotablePersonLive.svelte";
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import DateStamp from "$lib/DateStamp.svelte";
  import { timeString } from "$lib/timeUtils.ts";
  import { games } from "./games.ts";
  import ToolTip from "$lib/ToolTip.svelte";
  import LTTTime from "$lib/LTTTime.svelte";
  import { browser } from "$app/environment";
  import {page} from "$app/stores"
  import { toastStore } from "@skeletonlabs/skeleton";
  import {clipboard} from "@skeletonlabs/skeleton";

  export let data;

  const initialReloadNumber = data.reloadNumber;
  let nowish = Date.now();

  console.log(Object.keys(games).join(", "))

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

  // remove ?attempt after 500 error
  if(browser && $page.url.searchParams.has("attempt")) {
    const newURL = new URL(location.href);
    newURL.searchParams.delete("attempt");
    window.history.replaceState({}, document.title, newURL.pathname + (newURL.searchParams.size > 0 ? "?" + newURL.searchParams.toString() : ""));
  }

  let holdingShift = false;

  const updateHoldingShift = (e: KeyboardEvent | MouseEvent) => {
    holdingShift = e.shiftKey;
  }
</script>
<svelte:window on:keydown={updateHoldingShift} on:keyup={updateHoldingShift} on:mousemove={updateHoldingShift}/>
<svelte:head>
  <title>BocaBola/iitskasino Game Marathon</title>
  <meta name="description" content="BocaBola Game Marathon tracker" />
</svelte:head>
<div class="absolute top-0 right-0">
  <LTTTime boca={true}/>
</div>
<div class="container mx-auto p-2 pt-12 pb-32">
  <h1>BocaBola/iitskasino Game Marathon</h1>
  <br>
  <br>
  BocaBola and iitskasino will be playing each of these games, no matter how long it takes.<br>
  They are expecting the stream to last multiple days (they will apparently be sleeping on stream too)<br>
  <br>
  If games have multiple campaigns, they will only be playing through one of them.
  <br>
  <br>
  {#if data.liveData.isLive}
    <div class="max-w-5xl mx-auto">
      <NotablePersonLive shortResponse={data.liveData}/>
    </div>
    <br>
  {/if}
  <br>
  <h2>Game List</h2>
  Games that have already been played are greyed out. This list is not in a specific order, as the next game is chosen by a wheel spin.<br>
  <div class="game-list-container text-center">
    {#each Object.keys(games) as game (game)}
      {@const foundEvent = modifiedEvents.find(e => e.event_name.startsWith("start_" + game.split(" ")[0]))}
      {@const played = !!foundEvent}
      {@const currentlyPlaying = !!foundEvent?.current}
      <ToolTip id={game} placement="left-end">
        <svelte:fragment slot="icon">
          <div class="inline-block" class:opacity-10={played && !currentlyPlaying}>
            {#if game === "Streamers vs Chatters"}
              <div class="m-1 inline-block game-list-game">
                <div class="fake-game-image inline-flex justify-center w-full align-middle" class:currently-playing={currentlyPlaying}>
                  <span class="content-center relative bottom-1.5">
                    ?
                  </span>
                </div>
              </div>
            {:else}
              <div class="inline-block">
                <img src="/games/{game.replaceAll(':', '')}.webp" class="inline-block m-1 game-list-game" width="264" height="352" alt={game} class:currently-playing={currentlyPlaying}>
              </div>
            {/if}
          </div>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <span class="text-lg">
            {game}
          </span>
          {#if games[game]}
            <br>
            {games[game]}
          {/if}
          {#if played && !currentlyPlaying}
            <br>
            (this game has been played)
          {/if}
          {#if currentlyPlaying}
            <br>
            (this game is currently being played)
          {/if}
        </svelte:fragment>
      </ToolTip>
    {/each}
  </div>

  <br>
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
          {event.current ? "Playing" : "Played"} for
          {#if holdingShift}
            <button use:clipboard={Math.round(event.length/1e3)} on:click={() => {
                    toastStore.trigger({
                        message: "Copied to Clipboard!"
                    })
                }}>
              {Math.round(event.length/1e3)}
            </button>
          {:else}
            {timeString(event.length)}
          {/if}
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
      border-radius: 7px;
  }
  .just-chatting {
      object-fit: cover;
      aspect-ratio: 2/1;
  }

  .game-list-game {
      width: min(30vw, 10em);
      border-radius: 7px;
  }

  .fake-game-image {
      background-color: rgb(50, 50, 50);
      aspect-ratio: 3/4;
      border-radius: 4px;
      font-size: 5rem;
      overflow: hidden;
  }

  .game-list-container {
    @apply mx-auto;
    max-width: calc(min(30vw, 10em) * 6)
  }

  .currently-playing {
      border: 2px solid red;
  }
</style>