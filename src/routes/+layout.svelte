<script lang='ts'>
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/all.css';
	// Most of your app wide CSS should be put in this file
	import '../app.css';

    import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
    import { storePopup } from '@skeletonlabs/skeleton';

    import 'nprogress/nprogress.css';
    import {navigating, page} from '$app/stores';
    import NProgress from 'nprogress';

    NProgress.configure({
        // Full list: https://github.com/rstacruz/nprogress#configuration
        minimum: 0.16,
    });

    let progressTimeout;

    $: {
        if ($navigating) {
            if(progressTimeout) clearTimeout(progressTimeout);
            const startBar = () => {
                if ($navigating) {
                    NProgress.start();
                }
            };
            const toURL: URL = $navigating.to.url;
            if(toURL.pathname == "/history" && toURL.searchParams.has("old")) {
                startBar();
            } else {
                progressTimeout = setTimeout(startBar, 150);
            }
        }
        if (!$navigating) {
            if(progressTimeout) clearTimeout(progressTimeout);
            NProgress.done();
        }
    }

    storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<svelte:head>
    {#if !$page.url.pathname.startsWith("/history/show/")}
        <meta name="description" content="When is WAN? Who knows! At least you can look at when it started before.. (spoiler: it's late)">
    {/if}
</svelte:head>

<slot />
