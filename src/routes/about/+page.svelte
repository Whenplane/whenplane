<script>
    import {fade} from "svelte/transition";
    import {SlideToggle} from "@skeletonlabs/skeleton";
    import {browser} from "$app/environment";
    import { page } from "$app/stores";
    import { getCookie, setCookie } from "$lib/cookieUtils";

    let scrollY = 0;

    let noSpecialLateText = browser ? localStorage.getItem("no-special-late-text") === "true" : false;
    $: if(browser) localStorage.setItem("no-special-late-text", noSpecialLateText + "");

    let disableBlurHash = browser ? !(localStorage.getItem("disableBlurHash") !== "true") : false
    $: if(browser) localStorage.setItem("disableBlurHash", disableBlurHash + "");

    let disableNotableStreams = browser ? !(getCookie("disableNotableStreams") !== "true") : !($page.params.__c__disableNotableStreams !== "true")
    $: if(browser) setCookie("disableNotableStreams", disableNotableStreams + "");

    console.log({disableNotableStreams, server: $page.params.__c__disableNotableStreams, client: browser ? getCookie("disableNotableStreams") : undefined})

</script>
<svelte:window bind:scrollY/>
<svelte:head>
    <title>About {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
</svelte:head>
<ol class="breadcrumb pt-2 pl-2">
    <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    <li class="crumb">About & Preferences</li>
</ol>
<div class="container mx-auto items-center limit mt-16">
    <div class="space-y-5">
        <div class="card p-4 inline-block text-left m-2">
            <h1 class="text-center">About</h1>
            This website was made so it can be easier to tell when the WAN is starting, without having to go back between twitch/youtube.<br>
            There are also a bunch of other tools around LTT. Check the "More" dropdown on the countdown page for a list of these tools.
            <br>
            <br>
            Unless noted otherwise, all times are converted to <b>your local timezone</b>.<br>
            <br>
            This site is not affiliated with Linus Media Group, Floatplane, etc. It is just a side project of a fan.
            <br>
            <br>
            The site is
            <a href="https://github.com/ajgeiss0702/whenplane" target="_blank" rel="noopener">
                open-sourced</a>.
            Feel free to make contributions!<br>
            <br>
            If you are able to, I would highly appreciate <a href="https://paypal.me/ajgeiss0702">donations</a>.<br>
            Note that all of Whenplane services and domains work around to costing around US$20 per month to run, so any amount past that is just a thank-you to me.
            <br>
            <br>
            Huge thanks to
            <a href="https://thewandb.com/" target="_blank" rel="noopener">
                The WAN DB
            </a>
            for helping me understand Floatplane's API.
            <br>
            Also massive thanks to
            <a href="/noki" target="_blank" rel="noopener">
                NoKi
            </a>
            for allowing me to use his timestamps.

            <br>
            <br>
            <div class="text-center w-full">
                <h2 class="text-center">Why does it say WAN starts at 4:30?</h2>
                <div class="inline-block mx-auto">
                    <a href="/430.png">
                        <enhanced:img src="$lib/images/430-ai-upscaled.png" class="danwan" title="This image is AI upscaled due to the original screenshot being very low-resolution. Click the image to see the original." sizes="min(1728px, 100vw)"/>
                    </a>
                </div><br>
<!--                <img class="mx-auto danwan" src="/430.webp" alt="Dan confirming 4:30"/>-->
                <i>always has been</i>
            </div>
            <br>

            <br>
            <div class="text-left w-full">
                <h2 class="text-center">Contact</h2>
                If you have questions, concerns, or just want to send me a message, you can email me at
                <a href="mailto:hi@whenplane.com" target="_blank" rel="noopener">aj@whenplane.com</a>,
                or you can <a href="https://discord.gg/PmN9AJh6KR">join the Discord server</a>.<br>
                <br>
                If you want to contact me about something other than this site, you can see my
                <a href="https://about.ajg0702.us/contact">general contact information here</a>
            </div>
            <br>

            <div class="flex">
                <a class="btn variant-ghost-secondary" href="https://discord.gg/PmN9AJh6KR">
                    <img src="/discord-logo-white.svg" style="height: 1.5em;">
                </a>
                <a class="inline-block btn variant-ghost-primary ml-auto" href="https://about.ajg0702.us" target="_blank" rel="noopener">
                    Made by aj
                </a>
            </div>
        </div>
    </div>
</div>
<br>
<br>

<div class="limit mx-auto text-center">
    <div class="card p-4 inline-block text-left">
        <h1 class="text-center">
            Preferences
        </h1>
        <div class="text-center opacity-50 relative bottom-3">
            {#if scrollY <= 10}
                <span transition:fade|global>
                    (scroll)
                </span>
            {:else}
                &#8203;
            {/if}
        </div>

        <SlideToggle active="bg-primary-500" size="sm" bind:checked={noSpecialLateText} name="noSpecialLateText">
            Disable special "late" text
        </SlideToggle>
        <br>

        <SlideToggle active="bg-primary-500" size="sm" bind:checked={disableBlurHash} name="disableBlurHash">
            Disable "blur" on loading images
        </SlideToggle>
        <br>

        <SlideToggle active="bg-primary-500" size="sm" bind:checked={disableNotableStreams} name="disableNotableStreams">
            Disable "notable" stream (e.g. Elijah, Dan, Luke) boxes
        </SlideToggle>
        <br>

        <br>
        <a href="/notifications">Push Notification Settings</a>

    </div>
</div>

<div class="pb-48"></div>
<style>
    .danwan {
        height: 100px;
        width: auto;
    }
</style>