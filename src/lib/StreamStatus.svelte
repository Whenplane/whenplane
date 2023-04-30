<script>
    import Youtube from "./Youtube.svelte";
    import Twitch from "./Twitch.svelte";
    import Floatplane from "./Floatplane.svelte";

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
    <a class="logo-item" href="https://beta.floatplane.com/channel/linustechtips/live" target="_blank" rel="noreferrer">
        <span><Floatplane/></span>
        <span>
            Floatplane<br>
            <span class="status opacity-50" class:wan={data.liveStatus.floatplane.isWAN}>
                {#if data.liveStatus.floatplane.isLive}
                    {#if data.liveStatus.floatplane.isWAN}
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
</div>
<style>
    .status {
        font-weight: normal;
        font-size: 0.9em;
    }
    .logo-cloud {
        min-width: 700px;
    }
    .wan {
        color: green
    }
</style>