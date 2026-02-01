<script lang="ts">
	import { typed } from '$lib';

	let {
		src = typed<any>(),
		margin = typed<string>('m-1'),
		...rest
	} = $props();
</script>

<a href={src} class={margin} target="_blank" rel="noopener">
	<img {src} {...rest} />
</a>

<style>
	img {
		display: inline-block;
		border: rgba(255, 255, 255, 0.5) solid 2px;
		border-radius: 8px;
		margin-top: 0.5rem;
	}
</style>
