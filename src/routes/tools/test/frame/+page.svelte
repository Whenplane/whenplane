<script lang="ts">

  import { onMount } from "svelte";
  import { page } from "\$app/stores";

  let d: HTMLDivElement = $state();

  onMount(() => {
    const iframe = document.createElement("iframe");
    iframe.style.backgroundColor = "transparent";
    iframe.allowTransparency = "true";
    if($page.url.searchParams.has("time")) iframe.classList.add("testframe");

    iframe.src = $page.url.searchParams.has("time") ? "/ltt-time?frame" : "/?frame"

    d.appendChild(iframe)
  })

</script>

<div bind:this={d}></div>

<style>
  :global(.testframe) {
      height: 33px;
      width: 75px;
  }
  :global(iframe:not(.testframe)) {
    width: 90vw;
    height: 90vh;
  }

  div {
      background-color: black;
      padding: 2em;
  }
</style>