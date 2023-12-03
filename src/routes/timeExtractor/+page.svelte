<script>
  import { invalidateAll } from "$app/navigation";
  import { onDestroy } from "svelte";
  import HistoricalShow from "$lib/history/HistoricalShow.svelte";
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

  let images = [];
  $: {
    if(data.image?.length && data.show) {
      for (let i = 1; i <= data.image.length; i++) {
        images.push(i);
      }
    } else {
      images = [];
    }
  }

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
        document.body.scrollTo({top: 0, left: 0})
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
          {#if typeof data.image.text === "string"}
            {data.image.text}
          {:else}
            Processing{dot}<br>
            <pre>{typeof data.image.text}</pre>
          {/if}
          <br>

          <button class="btn variant-ghost-success w-5/12" formaction="?/correctTime" disabled={typeof data.image.text !== "string"} >
            Correct Time
          </button>
          {#key data.image.text}
            <input class="text input w-3/12 p-2" disabled={typeof data.image.text !== "string"} name="adjustedTime" value={data.image.text ?? ""}>
          {/key}
          <button class="btn variant-ghost-error w-2/12" formaction="?/adjustTime">
            Modify Time
          </button>
        {/if}
        <button formaction="?/skipShow" class="btn variant-ghost-warning w-6/12 mx-auto">Skip Show</button>

        <br>
        <br>
        <br>
        {#if data.image && data.show}
          {#each images as imageNum}
            <button formaction="?/selectImage&amp;image={imageNum}">

              <img
                src="/time-extracting/{data.show.metadata.vods.youtube}/screenshots/img{imageNum}.jpg"
                alt="Image {imageNum}"
                class="inline-block m-1"
                class:outdated={imageOutdated}
              >
            </button>
          {:else}
            No images?
          {/each}
          <br>
          <br>
          <button formaction="?/skipShow" class="btn variant-ghost-warning w-6/12 mx-auto">Skip Show</button>
          <br>
          <br>
        {/if}
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