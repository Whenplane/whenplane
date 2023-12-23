<script lang="ts">
  import { page } from "$app/stores";
  import { dev } from "$app/environment";

  $: data = $page.data;

  // Only show news if there is a post from the past 3 days
  $: isRecent = (data.lastNewsPost?.timestamp ?? 0) > (Date.now() - (3 * 24 * 60 * 60e3)) /*|| dev*/
  $: href = isRecent ? "/news/" + data.lastNewsPost.url : "/news";
</script>



<div class="text-center mt-2">
  <a class="hidden-link hover:!opacity-100 cursor-pointer" {href} class:small={!isRecent} class:opacity-70={isRecent}>
    {#if isRecent}
      ✨ {data.lastNewsPost.title}
    {:else}
      No recent news
    {/if}
  </a>
</div>

<style>
  .small {
      font-size: 0.8em;
      opacity: 25%;
  }
</style>