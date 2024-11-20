<script lang="ts">
  import type { HistoricalEntry, YoutubeThumbnail } from "$lib/utils.ts";

  export let show: HistoricalEntry;
  export let i = 0;

  const thumbnails = show.metadata?.thumbnails ?? show.metadata?.snippet?.thumbnails ?? show.value?.snippet?.thumbnails;
  const thumbnail = thumbnails?.maxres ??
    thumbnails?.standard ??
    thumbnails?.high ??
    thumbnails?.medium ??
    thumbnails?.default ??
    {url: 'https://i.ytimg.com/vi/' + show.metadata.vods?.youtube + '/maxresdefault.jpg', generated: true}

  if((thumbnail as YoutubeThumbnail & {generated?: true}).generated) {
    console.warn("Generated link for", show)
  }

</script>
<div class="inline-flex items-center">
  <img src="{thumbnail.url}" alt="" aria-hidden="true" loading={i > 10 ? "lazy" : undefined}>
  <div class="p-2">
    <span class="title">
      {show.metadata.title}
    </span><br>
    {new Date(show.name).toLocaleDateString(undefined, {dateStyle: "long"})}
  </div>
</div>
<style>
    img {
        height: 6em;
        aspect-ratio: 16 / 9;
        border-radius: var(--theme-rounded-base);
    }
    @media (max-width: 800px) {
        img {
            height: 4em;
        }

    }
    .title {

    }
</style>