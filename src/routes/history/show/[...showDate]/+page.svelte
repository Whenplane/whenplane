<script lang="ts">
    import HistoricalShow from "$lib/history/HistoricalShow.svelte";
    import {getClosestWan} from "$lib/timeUtils";
    import Floatplane from "$lib/svg/Floatplane.svelte";
    import Youtube from "$lib/svg/Youtube.svelte";
    import {getTimeUntil} from "$lib/timeUtils";
    import { dev } from "$app/environment";
    import { page } from "$app/stores";

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

    const backHash = (showDate.getTime() > 1683934200000 ? "" : "?old") + "#" + data.name;

    let onTimeUntil = data.metadata.mainShowStart ? getTimeUntil(showDate, new Date(data.metadata.mainShowStart).getTime()) : null;

    let onTimeString;
    $: if(onTimeUntil) onTimeString = onTimeUntil.distance < 5 * 60e3 ? "on time!" : (onTimeUntil.late ? onTimeUntil.string + "late" : onTimeUntil.string + "early!");
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

<div class="text-center limit mx-auto big-wrapper">
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
</div>
{#if dev}
<!--    <pre>{JSON.stringify(data, null, "\t")}</pre>-->
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