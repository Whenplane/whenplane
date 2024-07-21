<script lang="ts">
  import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";
  import { getClosestWan, getUTCDate } from "$lib/timeUtils.ts";
  import { page } from "$app/stores";

  export let data;

  $: titleParts = data.video.title.split("- WAN Show");

  $: wanDate = data.video.title.includes("- WAN Show") ? getClosestWan(new Date(titleParts[titleParts.length - 1])) : undefined;
</script>

<div class="limit mx-auto">
  <svelte:element this={wanDate ? "a" : "span"} class="!text-white !no-underline" href={wanDate ? "/history/show/" + getUTCDate(wanDate) : undefined}>
    <h1>{titleParts.length === 1 ? data.video.title : titleParts[0]}</h1>
    {#if titleParts.length !== 1}
      {titleParts.slice(1).join("- WAN Show")}
    {/if}
  </svelte:element>
  <br>
  <br>
  <h2>Merch Messages</h2>
  Hint: Use CTRL + F to search
  {#if data.video.status === "inprogress"}
    <br>
    <br>
    <span class="text-amber-300">
                Merch messages for this episode are incomplete.
            </span><br>
    They may still be processing. You can view the ones we have so far, or come back later for the complete list.
  {/if}
</div>
<svelte:head>
  <title>{data.video.title} - Whenplane Merch Messages</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/merch-messages">Merch Messages</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{data.video.title}</li>
</ol>

<div class="mx-auto pb-64">
  <table class="table rounded-none">
    <thead class="sticky top-0">
    <td>Name</td>
    <td>Type</td>
    <td>Text</td>
    <td>Timestamp</td>
    <td>Image</td>
    </thead>
    <tbody>
    {#each data.messages as message, i}
      <tr id={message.id} class:hashHighlight={$page.url.hash === "#" + message.id}>
        <td>{message.name}</td>
        <td>{message.type}</td>
        <td>{message.text}</td>
        <td><a href="https://youtu.be/{data.video.videoId}?t={(message.imageIndex*5)-5}">Timestamp</a></td>
        <td>
          {#if i > 10}
            <LargerLazyLoad>
              <img src="https://merch-message-images.whenplane.com/{message.video}/images/img{message.imageIndex}.jpg" width="1000" height="200">
            </LargerLazyLoad>
          {:else}
            <img src="https://merch-message-images.whenplane.com/{message.video}/images/img{message.imageIndex}.jpg" width="1000" height="200">
          {/if}
        </td>
      </tr>
    {/each}
    </tbody>
  </table>
  <div class="limit mx-auto">
    {#if data.video.status === "inprogress"}
      <br>
      <br>
      <span class="text-amber-300">
      Merch messages for this episode are incomplete.
    </span><br>
      They may still be processing. You can view the ones we have so far, or come back later for the complete list.
    {/if}
  </div>
</div>

<style>
  .hashHighlight {
      border: #d4163c 2px solid;
      border-radius: 12px;
  }
</style>