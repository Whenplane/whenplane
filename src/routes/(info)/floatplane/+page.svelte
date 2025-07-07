<script lang="ts">
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news";
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import {timeString} from "$lib/timeUtils";
  import DateStamp from "$lib/DateStamp.svelte";
  import { browser } from "$app/environment";

  import { getTimePreference } from "$lib/prefUtils";

  export let data;

  $: titleParts = data.floatplane?.title?.split(" - ");
  $: thumbnailChangedDate = new Date(data.floatplane?.thumbnailFirstSeen);
  $: titleChangedDate = new Date(data.floatplane?.titleFirstSeen);
  $: descriptionChangedDate = new Date(data.floatplane?.descriptionFirstSeen);
  $: liveStatusChangedDate = new Date(data.floatplane?.started ?? data.floatplane?.lastLive)
  let initialLiveStatusChangedDate = new Date(data.floatplane?.started ?? data.floatplane?.lastLive)
  $: console.debug({data})

  let lastInvalidate = 0;

  let thumbnailBlob: Blob | undefined = undefined;
  let lastUrl: string | undefined = undefined;
  $: {
    if(browser && data.floatplane?.thumbnail) {
      if(lastUrl !== data.floatplane?.thumbnail) {
        lastUrl = data.floatplane?.thumbnail;

        let img = new Image();

        img.onload = () => {
          let canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          let ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);

          // Convert the image to PNG format
          canvas.toBlob(i => {
            thumbnailBlob = i ?? undefined;
          }, "image/png")

        }

        img.src = "/floatplane/thumbnail";

      }
    } else {
      thumbnailBlob = undefined;
    }
  }


  let liveStatusChangeTime = "";

  onMount(() => {
    let i = setInterval(() => {
      if(!document.hidden) {
        invalidateAll();
        lastInvalidate = Date.now();
      }

      updateLiveStatusChangeTime();
    }, 5e3)

    return () => clearInterval(i);
  })

  updateLiveStatusChangeTime()

  function updateLiveStatusChangeTime() {
    const distance = Date.now() - (liveStatusChangedDate ?? initialLiveStatusChangedDate).getTime();
    const initial = timeString(distance, true)?.split(" ");
    if(distance > 60e3) {
      initial?.pop();
      initial?.pop();
      initial?.pop();
      initial?.pop();
    }
    liveStatusChangeTime = initial?.join(" ") ?? "";
  }
</script>

<svelte:head>
  <title>Floatplane Watcher</title>
</svelte:head>

<svelte:window on:focus={() => {
  if(Date.now() - lastInvalidate > 5e3) {
    invalidateAll();
    lastInvalidate = Date.now();
  }
}}/>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Floatplane Watcher</li>
</ol>

<div class="limit mx-auto px-2 pt-4 pb-16">
  <h1>Floatplane Metadata</h1>
  This info is fetched directly from Floatplane.<br>
  Up-to-date as of {new Date(data.floatplane?.fetched).toLocaleTimeString(undefined, {timeStyle: "medium", hour12: getTimePreference()})}<br>
  <br>


  <div class="out pb-2">
    <div class="opacity-80 card-title">
      Live or not?
    </div>
    <div class="px-4">
      <h2 class:green={data.floatplane?.isLive}>
        {data.floatplane?.isLive ? "Live" : "Offline"}
      </h2>
      for {liveStatusChangeTime}
    </div>
  </div>
  <br>

  <div class="out pb-2">
    <div class="opacity-80 card-title">
      Title
      <div class="opacity-70 float-right">
        Last changed:
        {#key titleChangedDate}
          <DateStamp epochSeconds={titleChangedDate.getTime()/1000}/>
        {/key}
      </div>
    </div>
    {#if titleParts}
      <div class="px-4">
        <h2>{titleParts[0]}</h2>
        {titleParts.slice(1).join(" - ")}
      </div>
    {:else}
      <span class="opacity-70">
        No title
      </span>
    {/if}
  </div>

  <br>

  <div class="out pb-2">
    <span class="opacity-80 card-title">
      Thumbnail
      <div class="opacity-70 float-right">
        Last changed:
        {#key thumbnailChangedDate}
          <DateStamp epochSeconds={thumbnailChangedDate.getTime()/1000}/>
        {/key}
      </div>
    </span>
    {#if data.floatplane?.thumbnail}
      <div class="px-4">
        <img src={data.floatplane?.thumbnail} alt="Current Thumbnail" title="Current Thumbnail">
        <span class="opacity-85">
          New: {data.floatplane?.isThumbnailNew}<br>
        </span>
      </div>
    {:else}
      <span class="opacity-70">
        No Thumbnail
      </span>
    {/if}
  </div>

  <br>

  <div class="out pb-2">
    <span class="opacity-80 card-title">
      Description
      <div class="opacity-70 float-right">
        Last changed:
        {#key descriptionChangedDate}
          <DateStamp epochSeconds={descriptionChangedDate.getTime()/1000}/>
        {/key}
      </div>
    </span>
    {#if data.floatplane?.description}
      <div class="px-4">
        {@html sanitizeHtml(data.floatplane?.description, newsSanitizeSettings)}
      </div>
    {:else}
      <span class="opacity-70">
        No description
      </span>
    {/if}
  </div>

</div>

<pre>{JSON.stringify(data.floatplane, undefined, '\t')}</pre>
<div class="p-4">
  <span class="text-sm opacity-60">
    Whenplane and the Whenplane Floatplane Watcher is not affiliated with or endorsed by Linus Media Group.
  </span>
</div>

<style>
  .out {
      border-radius: 5px;
      border: solid 1px rgba(255, 255, 255, 0.1);
  }

  img {
      border-radius: 5px;
  }

  .green {
      color: lawngreen;
  }

  .card-title {
      @apply px-2 py-1;
      display: block;
      border-bottom: solid 1px rgba(255, 255, 255, 0.1);
  }
</style>