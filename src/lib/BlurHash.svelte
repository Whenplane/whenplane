<script lang="ts">
  import type { BlurHash } from "$lib/utils.ts";
  import {decodeBlurHash as decode} from "fast-blurhash";
  import { onMount } from "svelte";

  export let blurhash: BlurHash;

  let needsCanvas = true;
  let canvas;
  let imageURL;

  const resolutionDecreaser = 10;

  onMount(() => {
    const pixels = decode(blurhash.hash, blurhash.w/resolutionDecreaser, blurhash.h/resolutionDecreaser);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(blurhash.w/resolutionDecreaser, blurhash.h/resolutionDecreaser);

    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    imageURL = canvas.toDataURL();
    needsCanvas = false;
  })

</script>
{#if needsCanvas}
  <canvas width={blurhash.w/resolutionDecreaser} height={blurhash.h/resolutionDecreaser} class="hidden" bind:this={canvas}></canvas>
{/if}
<img src={imageURL}>

<style>
  img {
      width: min(28.5rem, 95vw);
      aspect-ratio: 16 / 9;
  }
</style>
