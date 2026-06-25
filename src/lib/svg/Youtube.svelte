<script lang="ts">
	import { typed } from '$lib';
	import youtube from "./youtube.svg?raw"

	let { height = typed<number>(2.5) } = $props();
</script>

{@html youtube.replace("{height}", height)}