<script lang="ts">
  import type { WanDb_Topic } from "$lib/wdb_types.ts";
  import {slide} from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let subTopics: WanDb_Topic[];

  const firstFew = subTopics.filter((e, i) => i < 2)
  const rest = subTopics.filter((e, i) => i >= 2)

  let expanded = rest.length <= 1;
</script>

<ul class="normal-list ml-4">
  {#each firstFew as topic}

    <li>{topic.title}</li>

  {/each}

  {#if !expanded && rest}

    <button class="opacity-75 hover-underline" on:click={() => expanded = true}>
      ... And {rest.length} more
    </button>

  {:else if expanded && rest}

    {#each rest as topic}
      <li in:slide={{easing: quintOut}}>
        {topic.title}
      </li>
    {/each}

  {/if}
</ul>