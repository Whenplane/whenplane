<script lang="ts">
  import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";
  import { getClosestWan, getUTCDate } from "$lib/timeUtils.ts";

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
</div>

<div class="mx-auto">
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
      <tr>
        <td>{message.name}</td>
        <td>{message.type}</td>
        <td>{message.text}</td>
        <td><a href="https://youtu.be/hdG4vuTAE3Q?t={(message.imageIndex*5)-5}">Timestamp</a></td>
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
</div>