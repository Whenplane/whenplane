<script lang="ts">
  import {slide} from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import type { Timestamp } from "$lib/timestamps/types.ts";

  import { page } from "$app/stores";

  export let subTopics: Timestamp[];
  export let youtubeId: string;

  const firstFew = subTopics.filter((e, i) => i < 2)
  const rest = subTopics.filter((e, i) => i >= 2)

  const reduceFunc = (i, v) => {
    if(v && v.length > 0) {
      return i + 1 + (v?.reduce(reduceFunc, 0) ?? 0)
    } else {
      return i + 1;
    }
  }

  const totalSub = rest.reduce(reduceFunc, 0)

  let expanded = rest.length <= 1 || rest.map(t => "#timestamp-" + youtubeId + "." + t.time).includes($page.url.hash);
</script>

<ul class="normal-list ml-4">
  {#each firstFew as topic}

    <li id="timestamp-{youtubeId}.{topic.time}" class:highlighted={$page.url.hash === "#timestamp-" + youtubeId + "." + topic.time}>
      <a
        class="hidden-link"
        href="https://youtube.com/watch?v={youtubeId}&t={topic.time}"
        target="_blank" rel="noopener"
      >
        <span class="opacity-70">
          {topic.timeString}
        </span>
        {topic.name}
      </a>
    </li>

  {/each}

  {#if !expanded && rest}

    <button class="opacity-70 hover-underline" on:click={() => expanded = true}>
      ... And {totalSub} more
    </button>

  {:else if expanded && rest}

    {#each rest as topic}
      <li in:slide|global={{easing: quintOut}} id="timestamp-{youtubeId}.{topic.time}" class:highlighted={$page.url.hash === "#timestamp-" + youtubeId + "." + topic.time}>
        <a
          class="hidden-link"
          href="https://youtube.com/watch?v={youtubeId}&t={topic.time}"
          rel="noopener"
        >
          <span class="opacity-70">
            {topic.timeString}
          </span>
          {topic.name}
        </a>

        {#if topic.subTimestamps && topic.subTimestamps.length > 0}
          <svelte:self subTopics={topic.subTimestamps}/>
        {/if}
      </li>
    {/each}

  {/if}
</ul>

<style>
    .highlighted {
        border: solid 2px rgba(255, 255, 0, 0.5);
        border-radius: 4px;
        padding: 2px;
    }
</style>