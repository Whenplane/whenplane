<script lang="ts">
  import type { WanDb_Topic } from "$lib/wdb_types.ts";
  import {slide} from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let subTopics: WanDb_Topic[];

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

  let expanded = rest.length <= 1;
</script>

<ul class="normal-list ml-4">
  {#each firstFew as topic}

    <li>{topic.title}</li>

  {/each}

  {#if !expanded && rest}

    <button class="opacity-75 hover-underline" on:click={() => expanded = true}>
      ... And {totalSub} more
    </button>

  {:else if expanded && rest}

    {#each rest as topic}
      <li in:slide={{easing: quintOut}}>
        {topic.title}

        {#if topic.children}
          <svelte:self subTopics={topic.children}/>
        {/if}
      </li>
    {/each}

  {/if}
</ul>