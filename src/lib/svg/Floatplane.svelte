<script lang="ts">
	import { typed } from '$lib';
	import floatplane from "./floatplane.svg?raw";

	let {
		fill = typed<string>("currentColor"),
		height = typed<string>("32")
	} = $props();
</script>

{#if height !== "32" || fill !== "currentColor"}
  {@html floatplane
    .replaceAll('height="32" width="32"', `height="${height}" width="${height}"`)
    .replaceAll('fill="currentColor"', `fill="${fill}"`)
  }
{:else}
  {@html floatplane}
{/if}
