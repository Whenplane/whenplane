<script lang="ts">
  interface Props {
    withThumbnail?: boolean;
    onlyTimes?: boolean;
  }

  let { withThumbnail = false, onlyTimes = false }: Props = $props();

</script>

<div
  class:card={!onlyTimes}
  class="inline-block limit p-3 m-2 hidden-link relative"
>
  {#if !onlyTimes}
    {#if withThumbnail}
      <div class="thumbnail relative">
        <div class="thumbnail-placeholder placeholder animate-pulse"></div>
      </div>
    {/if}
    <h3><span class="placeholder animate-pulse w-32 inline-block"></span></h3>
    <h4><span class="placeholder animate-pulse w-72 inline-block"></span></h4>
  {/if}
  <hr>
  <div class="inline-block mr-2">
    <h4>Pre Show</h4>
    <span class="time">
      <span class="placeholder animate-pulse inline-block w-16"></span>
    </span>
    -
    <span class="time">
      <span class="placeholder animate-pulse inline-block w-16"></span>
    </span>
    <br>
    <span class="placeholder animate-pulse inline-block w-24"></span>
  </div>
  <div class="inline-block ml-2">
    <h4>Main Show</h4>
    <span class="time">
      <span class="placeholder animate-pulse inline-block w-16"></span>
    </span>
    -
    <span class="time">
      <span class="placeholder animate-pulse inline-block w-16"></span>
    </span>
    <br>
    <span class="placeholder animate-pulse inline-block w-24"></span>
  </div>
  <hr>
  <span class="placeholder animate-pulse inline-block w-64"></span>
</div>
<style>

    .thumbnail-space {
        width: min(28.5rem, 95vw);
        aspect-ratio: 16 / 9;
        max-width: 100%;
    }

    .thumbnail-placeholder {
        width: min(30rem, 95vw);
        object-fit: cover;
        border-radius: var(--theme-rounded-base);
        aspect-ratio: 16 / 9;
        height: auto;
    }

    .highlight {
        border: 1px solid darkgoldenrod;
    }


    .red {
        color: red;
    }
    .green {
        color: green;
    }
    .time {
        font-size: 1.25em;
        font-family: monospace;
    }
    a {
        width: min(30rem, 95vw);
    }
    .rounded {
        border-radius: var(--theme-rounded-base);
        overflow: hidden;
    }
</style>