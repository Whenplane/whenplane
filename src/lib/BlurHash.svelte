<script lang="ts">
  import type { BlurHash } from "$lib/utils.ts";
  import {decodeBlurHash as decode} from "fast-blurhash";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  export let blurhash: BlurHash;

  let pixels = browser ? decode(blurhash.hash, blurhash.w, blurhash.h) : undefined;

  let needsCanvas = true;
  let canvas;
  let imageURL;


  onMount(() => {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(blurhash.w, blurhash.h);

    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    imageURL = canvas.toDataURL();
    needsCanvas = false;
    pixels = undefined;
  })
</script>
{#if needsCanvas}
  <canvas width={blurhash.w} height={blurhash.h} class="hidden" bind:this={canvas}></canvas>
{/if}
<img src={imageURL}>
