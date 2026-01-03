<script lang="ts">
  import type {MMV2TableRow} from "$lib/merch-messages/mm-types.ts";
  import { Avatar } from "@skeletonlabs/skeleton";
  import PersonX from "svelte-bootstrap-icons/lib/PersonX.svelte";
  import ReplyFill from "svelte-bootstrap-icons/lib/ReplyFill.svelte";
  import { page } from "\$app/stores";
  import { colonTimeString } from "$lib/timeUtils.ts";
  import Youtube from "$lib/svg/Youtube.svelte";

  export let message: MMV2TableRow;
  export let youtubeId: string | undefined;

  const seconds = Math.floor(message.timestamp);
  const imageUrl = `https://merch-message-images.whenplane.com/${message.show}/images/${seconds}.jpg`
</script>
<div
  class="card card-hover relative p-4 my-3 mx-2 flex overflow-hidden text-left main-div"
  class:ml-6={message.type === "reply"}
  class:!bg-surface-900={message.type === "reply"}
  id={message.id}
  class:hashHighlight={$page.url.hash === "#" + message.id}
>
  <div class="flex-1 space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        {#if message.type === "message"}
          {#if message.name === "Anonymous"}
            <figure class="avatar">
              <PersonX/>
            </figure>
          {:else}
            <Avatar width="w-10" initials={message.name.charAt(0)}/>
          {/if}
          &nbsp;
          {message.name}
        {:else}
          <ReplyFill class="w-5 h-5 m-2"/>
          &nbsp;
          <div>
          <span class="opacity-80">
            Reply to
          </span>
            {message.name}
          </div>
        {/if}
      </div>
      <div class="justify-self-end pr-4 text-sm">
        <a href="https://youtube.com/watch?v={youtubeId}&t={seconds}" rel="noopener" class="btn btn-sm variant-ghost-surface py-0.5 px-1.5">
          <Youtube height="1.75"/>
          {colonTimeString(seconds)}
        </a>
      </div>
    </div>
    <div class="opacity-70 ml-4 pr-4">
      {message.text}
    </div>
  </div>
  <div class="w-full message-image shrink-0 self-center">
    <a href={imageUrl}>
      <img class="w-full" src={imageUrl} width="1000" height="200" loading="lazy">
    </a>
  </div>

</div>

<style>
  figure.avatar {
      @apply w-10 bg-surface-500 rounded-full flex aspect-square text-surface-50 font-semibold justify-center items-center overflow-hidden isolate;
  }

  .message-image {
      @apply mt-2;
  }
  .main-div {
    flex-direction: column;
  }
  @media (width >= 48rem) {
      .message-image {
          width: 28rem;
          margin: 0;
      }
      .main-div {
          flex-direction: row;
      }
  }

  .hashHighlight {
      border: #d4163c 2px solid;
      border-radius: 12px;
  }
</style>