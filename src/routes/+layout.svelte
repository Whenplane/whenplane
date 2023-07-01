<script lang='ts'>
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/all.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';

    import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
    import { storePopup } from '@skeletonlabs/skeleton';

    storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<svelte:head>
    <meta name="description" content="When is WAN? Who knows! At least you can look at when it started before..">
</svelte:head>

<slot />
