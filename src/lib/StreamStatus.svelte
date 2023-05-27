<script>
    import Youtube from "./svg/Youtube.svelte";
    import Twitch from "./svg/Twitch.svelte";
    import Floatplane from "./svg/Floatplane.svelte";
    import {popup} from "@skeletonlabs/skeleton";
    import {browser} from "$app/environment";
    import Info from "$lib/svg/Info.svelte";

    export let data;
</script>

<div class="logo-cloud grid-cols-1 lg:!grid-cols-3 gap-1">
    <a class="logo-item" href="https://www.twitch.tv/linustech" target="_blank" rel="noreferrer">
        <span><Twitch/></span>
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
    <a class="logo-item" href="https://www.youtube.com/linustechtips/live" target="_blank" rel="noreferrer">
        <span><Youtube/></span>
        <span>
            Youtube<br>
            <span class="status opacity-50" class:wan={data.liveStatus.youtube.isWAN}>
                {#if data.liveStatus.youtube.isLive}
                    {#if data.liveStatus.youtube.isWAN}
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
    <a class="logo-item" href="https://www.floatplane.com/channel/linustechtips/live" target="_blank" rel="noreferrer">
        <span><Floatplane/></span>
        <span>
            Floatplane
            {#if browser} <!-- Don't SSR info button since it wont work without client-side JS -->
                <span
                        class="text-surface inline-block fp-info [&>*]:pointer-events-none"
                        use:popup={{
                            event: 'hover',
                            target: 'floatplaneInfo',
                            placement: 'top'
                        }}
                >
                    <Info/>
                </span>
            {/if}
            <br>
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
            <!--<span class="status opacity-50" class:wan={data.liveStatus.floatplane.isWAN}>
                {#if data.liveStatus.floatplane.isLive}
                    {#if data.liveStatus.floatplane.isWAN}
                        (live)
                    {:else}
                        (live non-WAN)
                    {/if}
                {:else}
                    (offline)
                {/if}
            </span>-->
        </span>
    </a>
</div>
<div class="card p-4 whitespace-nowrap shadow-x1 z-10 font-normal" data-popup="floatplaneInfo">
    Floatplane does not have a (public) way to tell if LTT is streaming live.<br>
    So, instead we guess based on if twitch is live or not.<br>
    <br>
    There might be a way around this in the future.<br>
    If that happens, this will no longer say "probably"
</div>
<style>
    .status {
        font-weight: normal;
        font-size: 0.9em;
    }

    .logo-item {
        padding-left: 2em;
        padding-right: 2em;
    }

    .wan {
        color: green
    }

    @media (pointer: coarse) {
        .fp-info {
            display: none;
        }
    }
</style>
