<script lang="ts">
  import type { HistoricalEntry, YoutubeThumbnail } from "$lib/utils.ts";

  export let show: HistoricalEntry;
  export let i = 0;

  $: thumbnails = show.metadata?.thumbnails ?? show.metadata?.snippet?.thumbnails ?? show.value?.snippet?.thumbnails;
  $: thumbnail = thumbnails?.maxres ??
    thumbnails?.standard ??
    thumbnails?.high ??
    thumbnails?.medium ??
    thumbnails?.default ??
    {url: 'https://i.ytimg.com/vi/' + show.metadata.vods?.youtube + '/maxresdefault.jpg', generated: true}

  /*if((thumbnail as YoutubeThumbnail & {generated?: true}).generated) {
    console.warn("Generated link for", show)
  }*/

</script>
<div class="inline-flex items-center">
  <img src="{thumbnail.url}" alt="" aria-hidden="true" loading={i > 10 ? "lazy" : undefined}>
  <div class="p-2">
    {#if show.metadata.title}
      <span class="title">
        {show.metadata.title}
      </span><br>
    {/if}
    {new Date(show.name).toLocaleDateString(undefined, {dateStyle: "long"})}
  </div>
</div>
<style>
    img {
        height: 6em;
        aspect-ratio: 16 / 9;
        border-radius: var(--theme-rounded-base);
        object-fit: cover;
    }
    @media (max-width: 800px) {
        img {
            height: 4em;
        }

    }
    .title {
      font-weight: bold;
    }
</style>