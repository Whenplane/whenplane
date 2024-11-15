<script lang="ts">
  import type { HistoricalEntry } from "$lib/utils.ts";

  export let show: HistoricalEntry;
  export let i = 0;

</script>
<div class="inline-flex items-center">
  <img src="{show.metadata?.thumbnails?.maxres?.url ?? 'https://i.ytimg.com/vi/' + show.metadata.vods?.youtube + '/maxresdefault.jpg'}" alt="" aria-hidden="true" loading={i > 10 ? "lazy" : undefined}>
  <div class="p-2">
    {show.metadata.title}<br>
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
</style>