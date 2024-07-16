<script lang="ts">
    import HistoricalShow from "$lib/history/HistoricalShow.svelte";
    import {getClosestWan} from "$lib/timeUtils";
    import Floatplane from "$lib/svg/Floatplane.svelte";
    import Youtube from "$lib/svg/Youtube.svelte";
    import {getTimeUntil} from "$lib/timeUtils";
    import { dev } from "$app/environment";
    import { page } from "$app/stores";
    import type { WanDb_Topic } from "$lib/wdb_types.ts";
    import SubTopics from "$lib/subcomponents/SubTopics.svelte";

    export let data;

    const thumbnail = data.value?.snippet?.thumbnails?.maxres ??
        data.value?.snippet?.thumbnails?.standard ??
        data.value?.snippet?.thumbnails?.high ??
        data.value?.snippet?.thumbnails?.medium ??
        data.value?.snippet?.thumbnails?.default

    const snippet = data.value?.snippet ?? data.metadata?.snippet;

    const preShowStart = data.metadata.preShowStart ? new Date(data.metadata.preShowStart) : data.metadata.preShowStart;
    const mainShowStart = data.metadata.mainShowStart ? new Date(data.metadata.mainShowStart) : data.metadata.mainShowStart;
    const showEnd = data.metadata.showEnd ? new Date(data.metadata.showEnd) : data.metadata.showEnd;

    const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt));

    const backHash =  `?to=${showDate.getUTCFullYear()}#` + data.name;

    let onTimeUntil = data.metadata.mainShowStart ? getTimeUntil(showDate, new Date(data.metadata.mainShowStart).getTime()) : null;

    let onTimeString;
    $: if(onTimeUntil) onTimeString = onTimeUntil.distance < 5 * 60e3 ? "on time!" : (onTimeUntil.late ? onTimeUntil.string + "late" : onTimeUntil.string + "early!");


    $: topics = (() => {
        let r: WanDb_Topic[] = [];
        if(!data.wdb?.topics) return [];
        for (let topic of data.wdb.topics) {
            const existing = r.find(t => t.start == topic.start)
            if(!existing) r.push(topic);
        }
        return r;//r.filter(t => t.title !== "Merch Messages" && t.title !== "Sponsor Spots");
    })()
</script>
<svelte:head>
    <title>{data.metadata.title ?? ""}{data.metadata.title ? " - " : ""}WAN Show {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})}</title>
    <meta name="description" content="WAN show from {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})}. {onTimeString ? 'It was ' + onTimeString : ''}">
    {#if thumbnail}
        <meta property="og:image" content={thumbnail.url}>
    {/if}
</svelte:head>

{#if thumbnail}
    <div class="thumbnail-backdrop" aria-hidden="true">
        <img src={thumbnail.url} alt={thumbnail.text ?? "Thumbnail for this show"}/>
    </div>
{/if}


<ol class="breadcrumb pt-2 pl-2">
    <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    <li class="crumb"><a class="anchor hover-underline" href="/history">History</a></li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    <li class="crumb"><a class="anchor hover-underline" href="/history{backHash}">{showDate.toLocaleDateString()}</a></li>
</ol>

<div class="text-center limit mx-auto big-wrapper mb-96 px-2">
    <h1>{showDate.toLocaleDateString(undefined, {dateStyle: "long"})}</h1>
    {#if thumbnail}
        <br>
        <img class="thumbnail" src={thumbnail.url} alt={thumbnail.text ?? "Thumbnail for this show"} title={thumbnail.text ?? "Thumbnail for this show"}/>
    {/if}
    {#if data.metadata.title}
        <h2>{data.metadata.title}</h2>
    {/if}

    <HistoricalShow onlyTimes={true} show={data} bind:onTimeUntil={onTimeUntil}/>
    <br>

    {#if !data.value?.snippet}
        This show doesn't currently have extra metadata (thumbnails, titles, and possibly vod links).
        <br>
        If this show is currently in the pre-show, this is normal.
        <br>
        <br>
        If this show is either currently live or is a past show, please contact aj about this so he can fix it!
    {/if}

    {#if data.metadata.vods?.floatplane}
        <a href="https://floatplane.com/post/{data.metadata.vods.floatplane}" target="_blank" rel="noopener">
            <Floatplane/> VOD on Floatplane
        </a>
    {/if}
    <br>
    {#if data.metadata.vods?.youtube}
        <a href="https://youtube.com/watch?v={data.metadata.vods.youtube}" target="_blank" rel="noopener">
            <Youtube/> VOD on Youtube
        </a>
    {/if}
    <br>
    <br>
    {#if data.metadata.vods?.youtubeParts && data.metadata.vods.youtubeParts.length > 0}
        This show has multiple youtube VOD parts:
        {#each data.metadata.vods?.youtubeParts as id, i}
            <a href="https://youtube.com/watch?v={id}" target="_blank" rel="noopener">
                Part {i+1}
            </a>
        {/each}
    {/if}

    <br>
    <br>

    {#if data.mm}
        <h2>Merch Messages</h2>
        <a href="/merch-messages/{data.mm.videoId}">View Merch Messages</a><br>

        {#if data.mm.status === "inprogress"}
            <br>
            <span class="text-amber-300">
                Merch messages for this episode are incomplete.
            </span><br>
            They may still be processing. You can view the ones we have so far, or come back later for the complete list.
        {/if}

        <br>
        <br>
    {/if}

    {#if topics && topics.length > 0}
        <h2>Show Info</h2>
        Provided by
        <a href="https://thewandb.com/archive/{data.wdb.id}" target="_blank" rel="noopener">
            <img src="/thewandb.svg" style="height: 2.5em; display: inline-block" alt="The WAN Database"/>
        </a>

        <div class="text-left">
            {#if topics && topics.length > 0}
                <h3>Topics</h3>
                <ol class="normal-list">
                    {#each topics as topic, i}
                        <li class="!mt-0 !mb-0 !p-0">
                            <span>
                                {topic.title}

                                {#if topic.children}
                                    <SubTopics subTopics={topic.children}/>
                                {/if}
                            </span>

                        </li>
                    {/each}
                </ol>
            {/if}
        </div>
    {/if}
</div>
<span class="clear">.</span> <!-- this has to be here otherwise safari ignores the padding for some reason -->
{#if dev}
<!--    <pre>{JSON.stringify(data.wdb, null, "\t")}</pre>-->
{/if}

<style>
    .big-wrapper {
        margin-top: 2em;
    }

    .thumbnail {
        height: min(15em, 50vw);
        @apply mx-auto;
        object-fit: cover;
        border-radius: 8px;
        aspect-ratio: 16 / 9;
    }

    .thumbnail-backdrop {
        position: absolute;
        top: 0;
        z-index: -1;
        mask: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0));
        height: 35vw;
        overflow-y: hidden;
    }

    .thumbnail-backdrop > img {
        opacity: 25%;
        width: 100vw;
        height: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
    }
</style>