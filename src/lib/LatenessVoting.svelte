<script lang="ts">

  import { page } from "$app/stores";
  import { browser, dev } from "$app/environment";
  import type { UserVote } from "$lib/voting";
  import { vote_valid_for } from "$lib/voting";
  import {enhance} from "$app/forms";
  import type { MainLate } from "$lib/utils.ts";
  import type { Writable } from "svelte/store";
  import { nextFast } from "$lib/stores.ts";
  import Info from "$lib/svg/Info.svelte";
  import {popup} from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { n } from "$lib/timeUtils.ts";
  import { e } from "$lib/utils.ts";
  import { strip } from "$lib/cookieUtils.ts";

  export let mainLate: Writable<MainLate>;

  $: total = $page.data.liveStatus?.votes?.reduce((a, x) => a + x.votes, 0) || 1;

  let userVote = browser ? JSON.parse(localStorage.getItem("latenessVote") ?? "{\"lastVote\":0}") as UserVote : {lastVote:0}

  let vd = "";
  onMount(() => {
    const i = setInterval(updateVd, 3e3);
    return () => clearInterval(i);
  });

  function updateVd() {
    vd = strip(e(n()+""))
  }


</script>

How late do you think the show will be?


<div class="inline-block relative">
  <div
    class="absolute bottom-0 text-surface pt-3 inline-block info [&>*]:pointer-events-none"
    use:popup={{
    event: 'hover',
    target: 'latenessVotingInfo',
    placement: 'top'
  }}
  >
    <Info/>
  </div>
</div>

<div data-popup="latenessVotingInfo">
  <div class="card p-4 whitespace-nowrap shadow-x1 z-10 font-normal">
    Lateness voting starts every Friday at midnight UTC, and runs until the show starts.
  </div>
</div>
<br>

<form method="POST" use:enhance={({action}) => {
        userVote = {
          lastVote: Date.now(),
          lastVoteFor: action.searchParams.get("for") ?? undefined
        };
        localStorage.setItem("latenessVote", JSON.stringify(userVote));
        nextFast.nextFast = true;
        return async ({ update }) => {
          await update({ reset: false });
        };
      }}>
  {#each $page.data.liveStatus?.votes as option}
    {@const passed = $mainLate.late && Math.abs($mainLate.distance ?? 0) > option.time}
    <button class="block w-full text-left background relative" formaction="?/vote&for={encodeURIComponent(option.name)}&k={vd}" class:passed={passed}>
      <span class="block percent" style="width: {(option.votes / total) * 100}%">
        <span class="inline-block px-2">
          <span class:passed={passed}>
            {option.name}
          </span>
          {#if userVote && userVote.lastVoteFor === option.name && (Date.now() - userVote.lastVote < vote_valid_for)}
            &nbsp;
            <span class="opacity-75">
              (your vote)
            </span>
          {/if}
        </span>
        <span class="absolute right-2 top-0">
          {#if total > 100 || dev}
            {Math.floor((option.votes / total) * 1000)/10}%
          {:else}
            {Math.floor((option.votes / total) * 100)}%
          {/if}
        </span>
      </span>
    </button>
  {/each}
</form>

<style>
  .percent {
      background-color: rgba(100, 100, 255, 0.25);
      border-radius: 4px;
      overflow: visible;
      white-space: nowrap;
      transition: width 300ms;
  }
  .passed .percent {
      background-color: rgba(100, 100, 100, 0.25) !important;
  }
  .passed {
      text-decoration: line-through;
  }
  .background {
      @apply my-2;
      background-color: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
  }

  @media (pointer: coarse) {
      .info {
          display: none;
      }
  }
</style>