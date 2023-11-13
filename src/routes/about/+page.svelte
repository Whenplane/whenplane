<script>
    import {fade} from "svelte/transition";
    import {SlideToggle} from "@skeletonlabs/skeleton";
    import {browser} from "$app/environment";
    import { page } from "$app/stores";

    let scrollY = 0;

    let noSpecialLateText = browser ? localStorage.getItem("no-special-late-text") === "true" : false;
    $: if(browser) localStorage.setItem("no-special-late-text", noSpecialLateText + "");

    let disableBlurHash = browser ? !(localStorage.getItem("disableBlurHash") !== "true") : false
    $: if(browser) localStorage.setItem("disableBlurHash", disableBlurHash + "");

</script>
<svelte:window bind:scrollY/>
<svelte:head>
    <title>About {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
</svelte:head>
<div class="container h-full mx-auto flex justify-center items-center limit">
    <div class="space-y-5">
        <div class="card p-4 inline-block text-left m-2 relative bottom-12">
            <h1 class="text-center">About</h1>
            This website was made so it can be easier to tell when the WAN is starting, without having to go back between twitch/youtube.
            <br>
            <br>
            This site is not affiliated with Linus Media Group. It is just a side project of a fan.
            <br>
            <br>
            The site is
            <a href="https://github.com/ajgeiss0702/wheniswan" target="_blank" rel="noopener">
                open-sourced</a>.
            Feel free to make contributions!
            <br>
            <br>
            Huge thanks to
            <a href="https://thewandb.com/" target="_blank" rel="noopener">
                The WAN DB
            </a>
            for the floatplane live detection

            <br>
            <br>
            <div class="text-center w-full">
                <h2 class="text-center">Why does it say WAN starts at 4:30?</h2>
                <enhanced:img class="mx-auto danwan" src="$lib/images/430.png" alt="Dan confirming 4:30"/>
                <i>always has been</i>
            </div>
            <br>

            <div class="text-right">
                <a class="btn variant-ghost-primary" href="https://about.ajg0702.us" target="_blank" rel="noopener">
                    Made by aj
                </a>
            </div>
        </div>
    </div>
</div>


<div class="limit mx-auto relative bottom-22 preferences-container text-center">
    <div class="card p-4 inline-block text-left">
        <h1 class="text-center">
            Preferences
        </h1>
        <div class="text-center opacity-50 relative bottom-3">
            {#if scrollY <= 10}
                <span transition:fade>
                    (scroll)
                </span>
            {:else}
                &#8203;
            {/if}
        </div>

        <SlideToggle active="bg-primary-500" size="sm" bind:checked={noSpecialLateText}>
            Disable special "late" text
        </SlideToggle>
        <br>

        <SlideToggle active="bg-primary-500" size="sm" bind:checked={disableBlurHash}>
            Disable "blur" on loading images
        </SlideToggle>


    </div>
</div>


<div class="absolute bottom-0 right-0 p-2">
    <a href="/">Back to Countdown</a>
</div>
<style>
    .danwan {
        height: 60px;
    }
    .preferences-container {

    }
</style>