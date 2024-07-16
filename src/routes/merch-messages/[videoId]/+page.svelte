<script lang="ts">
  import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";

  export let data;
</script>

<div class="limit mx-auto">
  <table class="table">
    <thead>
    <td>Name</td>
    <td>Type</td>
    <td>Image</td>
    </thead>
    <tbody>
    {#each data.messages as message, i}
      <tr>
        <td>{message.name}</td>
        <td>{message.type}</td>
        <td>
          {#if i > 10}
            <LargerLazyLoad>
              <img src="https://merch-message-images.whenplane.com/{message.video}/images/img{message.imageIndex}.jpg">
            </LargerLazyLoad>
          {:else}
            <img src="https://merch-message-images.whenplane.com/{message.video}/images/img{message.imageIndex}.jpg">
          {/if}
        </td>
      </tr>
    {/each}
    </tbody>
  </table>
</div>