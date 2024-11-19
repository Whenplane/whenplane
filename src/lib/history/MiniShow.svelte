<script lang="ts">
  import type { HistoricalEntry } from "$lib/utils.ts";

  export let show: HistoricalEntry;
  export let i = 0;

  const meta = show.metadata;
  const thumbnail = meta?.thumbnails?.maxres ??
    meta?.thumbnails?.standard ??
    meta?.thumbnails?.high ??
    meta?.thumbnails?.medium ??
    meta?.thumbnails?.default ??
    {url: 'https://i.ytimg.com/vi/' + show.metadata.vods?.youtube + '/maxresdefault.jpg'}

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