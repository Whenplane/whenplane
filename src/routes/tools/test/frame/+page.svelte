<script lang="ts">

  import { onMount } from "svelte";

  let d: HTMLDivElement;

  onMount(() => {
    const iframe = document.createElement("iframe");
    iframe.style.backgroundColor = "transparent";
    iframe.allowTransparency = "true";
    iframe.classList.add("testframe");

    iframe.src = "/ltt-time?frame"

    d.appendChild(iframe)
  })

</script>

<div bind:this={d}></div>

<style>
  :global(.testframe) {
      height: 33px;
      width: 75px;
  }

  div {
      background-color: black;
      padding: 2em;
  }
</style>