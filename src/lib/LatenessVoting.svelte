<script lang="ts">

  import { page } from "$app/stores";
  import { browser, dev } from "$app/environment";
  import type { UserVote } from "$lib/voting";
  import { vote_valid_for } from "$lib/voting";
  import {enhance} from "$app/forms";

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
    <button class="block w-full text-left background relative" formaction="?/vote&for={encodeURIComponent(option.name)}">
      <span class="block percent" style="width: {(option.votes / total) * 100}%">
        <span class="inline-block px-2">
          {option.name}
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
  .background {
      @apply my-3;
      background-color: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
  }
</style>