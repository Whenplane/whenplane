<script lang="ts">

  import { page } from "$app/stores";
  import { browser, dev } from "$app/environment";
  import type { UserVote } from "$lib/voting";
  import { vote_valid_for } from "$lib/voting";
  import {enhance} from "$app/forms";
  import type { MainLate } from "$lib/utils.ts";

  export let mainLate: MainLate;

  $: total = $page.data.liveStatus?.votes?.reduce((a, x) => a + x.votes, 0) || 1;

  let userVote = browser ? JSON.parse(localStorage.getItem("latenessVote") ?? "{\"lastVote\":0}") as UserVote : {lastVote:0}

</script>

How late do you think the show will be?
<br>

<form method="POST" use:enhance={({action}) => {
        userVote = {
          lastVote: Date.now(),
          lastVoteFor: action.searchParams.get("for")
        };
        localStorage.setItem("latenessVote", JSON.stringify(userVote));
        return async ({ update }) => {
          await update({ reset: false });
        };
      }}>
  {#each $page.data.liveStatus?.votes as option}
    {@const passed = Math.abs($mainLate.distance) > option.time}
    <button class="block w-full text-left background relative" formaction="?/vote&for={encodeURIComponent(option.name)}" class:passed={passed}>
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
        <span class="absolute right-2">
          {Math.floor((option.votes / total) * 100)}%
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
      @apply my-3;
      background-color: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
  }
</style>