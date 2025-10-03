<script lang="ts">
  import { page } from "$app/stores";
  import { dev } from "$app/environment";
  import { onMount } from "svelte";

  $: data = $page.data;

  let minuteNow = Date.now();

  onMount(() => {
    let i = setInterval(() => minuteNow = Date.now(), 60e3);
    return () => clearInterval(i);
  })

  // Only show news if there is a post from the past 15 days
  $: isRecent = (data.lastNewsPost?.timestamp ?? 0) > (Date.now() - (15 * 24 * 60 * 60e3)) && (data.lastNewsPost?.timestamp ?? 0 < minuteNow) /*|| dev*/
  $: href = isRecent ? "/news/" + data.lastNewsPost.url : "/news";
</script>



<div class="text-center mt-2 absolute top-0 left-0 right-0 z-10">
  <a class="hidden-link hover:!opacity-100 cursor-pointer" {href} class:small={!isRecent} class:opacity-70={isRecent}>
    {#if isRecent}
      ✨ {data.lastNewsPost.title}
    {:else}
      No recent site news
    {/if}
  </a>
</div>

<style>
  .small {
      font-size: 0.8em;
      opacity: 25%;
  }
</style>