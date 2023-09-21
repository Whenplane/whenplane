<script>
  import { invalidateAll } from "$app/navigation";
  import { onDestroy } from "svelte";
  import HistoricalShow from "$lib/HistoricalShow.svelte";
  import {enhance} from "$app/forms";

  export let data;

  let invalidationInterval;

  const dots = [
    ".",
    "..",
    "..."
  ];
  let doti = 0;
  $: dot = dots[doti];

  let imageOutdated = false;

  $: checkImage(data);
  $: console.log({data})
  function checkImage() {
    clearInterval(invalidationInterval);
    if(!data.image || (data.image.verifyText && !data.image.text)) {
      invalidationInterval = setInterval(() => {
        invalidateAll();

        doti++;
        if(doti >= dots.length) {
          doti = 0;
        }
      }, 1e3);
    }
  }

  onDestroy(() => {
    clearInterval(invalidationInterval);
  })
</script>
<div class="limit mx-auto">
  {#if data.done}
    All done!
  {:else}
    {#if data.show}
      <div class="text-center">
        {#key data.show}
          <HistoricalShow show={data.show} withThumbnail={true}/>
        {/key}
      </div>
      <br>
    {/if}
    {#if data.image}
      image
      <img src="{data.image.path}" class="w-full" class:outdated={imageOutdated}/>
      <form method="POST" class="text-center" use:enhance={() => {
        imageOutdated = true
        return async ({ update }) => {
                await update({ reset: false });
                imageOutdated = false
            };
      }}>
        {#if data.image.promptText}
          <button class="btn variant-ghost-success w-5/12" formaction="?/hasTime">
            Has time
          </button>
          <button class="btn variant-ghost-error w-5/12" formaction="?/noTime">
            No time
          </button>
        {/if}
        {#if data.image.verifyText}
          Text:
          {#if data.image.text}
            {data.image.text}
          {:else}
            Processing{dot}
          {/if}
          <br>

          <button class="btn variant-ghost-success w-5/12" formaction="?/correctTime" disabled={!data.image.text} >
            Correct Time
          </button>
          {#key data.image.text}
            <input class="text input w-3/12 p-2" disabled={!data.image.text} name="adjustedTime" value={data.image.text ?? ""}>
          {/key}
          <button class="btn variant-ghost-error w-2/12" formaction="?/adjustTime">
            Modify Time
          </button>
        {/if}
        <button formaction="?/skipShow" class="btn variant-ghost-warning w-6/12 mx-auto">Skip Show</button>
      </form>
    {:else}
      {#if data.downloading}
        Downloading VOD{dot}
      {/if}
      {#if data.processing}
        Processing images{dot}
      {/if}
      <br>
      Loading
    {/if}
  {/if}
</div>

<style>
  .outdated {
      opacity: 25%;
  }
</style>