<script lang="ts">
    import Youtube from "./svg/Youtube.svelte";
    import Twitch from "./svg/Twitch.svelte";
    import Floatplane from "./svg/Floatplane.svelte";
    import {onMount} from "svelte";
    import { page } from "$app/stores";
    import {timeString} from "$lib/timeUtils";

    export let data;

    // $: useTwitchFallback = (!data.isWdbResponseValid && (Date.now() - $wdbSocketState.lastReceive > 300e3));
    // $: if(useTwitchFallback) console.debug("Using twitch fallback:", data.isWdbResponseValid, $wdbSocketState.lastReceive);

    let nowish = Date.now();

    let mounted = false;
    onMount(() => {
        mounted = true;
        let i = setInterval(() => {
            nowish = Date.now();
        }, 1e3);
        return () => clearInterval(i);
    });
</script>

<!--<WdbListener/>-->

<div class="logo-cloud grid-cols-1 md:!grid-cols-3 gap-1">
    <a class="logo-item" href="https://www.twitch.tv/linustech" target="_blank" rel="noopener">
        <span>
            {#if $page.url.searchParams.has("boca")}
                <img class="absolute z-0 rounded-lg" style="margin-left: 1px; height: 26px; width: 30px;" src="/secret/boca-cropped.jpg"/>
            {/if}
            <span class="inline-block relative z-10">
                <Twitch/>
            </span>
        </span>
        <span>
            Twitch<br>
            <span class="status opacity-50" class:wan={data.liveStatus.twitch.isWAN}>
                {#if data.liveStatus.twitch.isLive}
                    {#if data.liveStatus.twitch.isWAN}
                        (live)
                    {:else}
                        (live non-WAN)
                    {/if}
                {:else}
                    (offline)
                {/if}
            </span>
        </span>
    </a>
    <a class="logo-item" href="/youtube-redirect" target="_blank">
        <span>
            {#if $page.url.searchParams.has("boca")}
                <img class="absolute z-10 rounded-md opacity-50" style="margin-left: 6px; margin-top: 7px; height: 26px; width: 37px;" src="/secret/boca-cropped.jpg"/>
            {/if}
            <span class="inline-block relative z-0">
                <Youtube/>
            </span>
        </span>
        <span>
            Youtube<br>
            <span class="status opacity-50" class:wan={data.liveStatus.youtube?.isWAN} class:upcoming={data.liveStatus.youtube?.upcoming}>
                {#if data.liveStatus.youtube?.isLive}
                    {#if data.liveStatus.youtube.isWAN}
                        (live)
                    {:else}
                        (live non-WAN)
                    {/if}
                {:else}
                    {#if data.liveStatus.youtube?.upcoming}
                        {#if data.liveStatus.youtube.scheduledStart && new Date(data.liveStatus.youtube.scheduledStart).getTime() > nowish}
                            (scheduled:
                            <span class="inline-block min-w-[65px]">
                                {timeString(new Date(data.liveStatus.youtube.scheduledStart).getTime() - nowish).trim()})
                            </span>
                        {:else}
                            (upcoming)
                        {/if}
                    {:else}
                        (offline)
                    {/if}
                {/if}
            </span>
        </span>
    </a>
    <a class="logo-item" href="https://www.floatplane.com/channel/linustechtips/live" target="_blank" rel="noopener">
        <span>
            {#if $page.url.searchParams.has("boca")}
                <img class="absolute z-0 rounded-full" style="margin-left: 2px; margin-top: 4px; height: 26px; width: 26px;" src="/secret/boca-cropped.jpg"/>
            {/if}
            <div class="inline-block relative z-10">
                <Floatplane/>
            </div>
        </span>
        <span>
            Floatplane<br>
            <span class="status opacity-50" class:wan={data.liveStatus?.floatplane?.isWAN && data.liveStatus?.floatplane?.isLive} class:upcoming={data.liveStatus?.floatplane?.isThumbnailNew}>
                {#if data.liveStatus.floatplane?.isLive}
                    {#if data.liveStatus?.floatplane?.isWAN}
                        (live)
                    {:else}
                        (live non-WAN)
                    {/if}
                {:else}
                    {#if data.liveStatus?.floatplane?.isThumbnailNew}
                        (upcoming{data.liveStatus?.floatplane?.isWAN ? "" : " non-wan"})
                    {:else}
                        (offline)
                    {/if}
                {/if}
            </span>
        </span>
    </a>
    <!-- Old WanDB floatplane live detection
    <a class="logo-item" href="https://www.floatplane.com/channel/linustechtips/live" target="_blank" rel="noopener">
        <span><Floatplane/></span>
        <span>
            Floatplane
            {#if mounted && useTwitchFallback} </!-- Don't SSR info button since it wont work without client-side JS --/>
                <span
                        class="text-surface inline-block fp-info [&>*]:pointer-events-none"
                        use:popup={{
                            event: 'hover',
                            target: 'floatplaneInfo',
                            placement: 'top'
                        }}
                        in:fade|global={{duration: 150}}
                >
                    <Info/>
                </span>
            {/if}
            <br>
            {#if !useTwitchFallback}
                <span class="status opacity-50" class:wan={$floatplaneState?.live && $floatplaneState?.isWAN}>
                    {#if $floatplaneState?.live}
                        {#if $floatplaneState?.isWAN}
                            (live)
                        {:else}
                            (live non-WAN)
                        {/if}
                    {:else}
                        (offline)
                    {/if}
                </span>
            {:else}
                <span class="status opacity-50" class:wan={data.liveStatus.twitch.isWAN}>
                    {#if data.liveStatus.twitch.isLive}
                        {#if data.liveStatus.twitch.isWAN}
                            (probably live)
                        {:else}
                            (probably live non-WAN)
                        {/if}
                    {:else}
                        (probably offline)
                    {/if}
                </span>
            {/if}
        </span>
    </a>-->
</div>
<!--<div class="card p-4 whitespace-nowrap shadow-x1 z-10 font-normal" data-popup="floatplaneInfo">
    Floatplane does not have a (public) way to tell if LTT is streaming live.<br>
    So, instead we guess based on if twitch is live or not.<br>
    <br>
    Normally we would use TheWanDb's reverse-engineering,<br>
    but TheWanDb appears to be having issues right now,<br>
    so we are falling back to twitch
</div>-->
<style>
    .status {
        font-weight: normal;
        font-size: 0.9em;
    }

    .logo-item {
        padding-left: 2em;
        padding-right: 2em;

        padding-top: 1.5em;
        padding-bottom: 1.5em;
    }

    :global(.boca-theme) .logo-item {
        background-color: rgba(26, 28, 38, 0.6);
    }

    .wan {
        color: green
    }

    .upcoming {
        color: yellow;
    }

    @media (pointer: coarse) {
        .fp-info {
            display: none;
        }
    }
</style>
