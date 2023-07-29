<script lang="ts">
    import HistoricalShow from "$lib/HistoricalShow.svelte";
    import {getClosestWan} from "$lib/timeUtils";
    import Floatplane from "$lib/svg/Floatplane.svelte";
    import Youtube from "$lib/svg/Youtube.svelte";
    import {getTimeUntil} from "$lib/timeUtils";

    export let data;

    const thumbnail = data.value?.snippet?.thumbnails?.maxres ??
        data.value?.snippet?.thumbnails?.standard ??
        data.value?.snippet?.thumbnails?.high ??
        data.value?.snippet?.thumbnails?.medium ??
        data.value?.snippet?.thumbnails?.default

    const showDate = getClosestWan(new Date(data.metadata.preShowStart ?? data.metadata.mainShowStart));

    let onTimeUntil = data.metadata.mainShowStart ? getTimeUntil(showDate, new Date(data.metadata.mainShowStart).getTime()) : null;

    let onTimeString;
    $: if(onTimeUntil) onTimeString = onTimeUntil.distance < 5 * 60e3 ? "on time!" : (onTimeUntil.late ? onTimeUntil.string + "late" : onTimeUntil.string + "early!");
</script>
<svelte:head>
    <title>{data.metadata.title ?? ""}{data.metadata.title ? " - " : ""}WAN Show {showDate.toLocaleDateString()}</title>
    <meta name="description" content="WAN show from {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})}. {onTimeString ? 'It was ' + onTimeString : ''}">
    {#if thumbnail?.maxres}
        <meta property="og:image" content={thumbnail.url}>
    {/if}
</svelte:head>

<!--<pre>{JSON.stringify(data, null, "\t")}</pre>-->

<div class="text-center limit mx-auto big-wrapper">
    <h1>{showDate.toLocaleDateString(undefined, {dateStyle: "long"})}</h1>
    {#if thumbnail}
        <br>
        <img class="thumbnail" src={thumbnail.url} alt="Thumbnail for show"/>
    {/if}
    {#if data.metadata.title}
        <h2>{data.metadata.title}</h2>
    {/if}

    <HistoricalShow onlyTimes={true} show={data} bind:onTimeUntil={onTimeUntil}/>
    <br>

    {#if !data.value?.snippet}
        This show doesn't currently have extra metadata (thumbnails, titles, and possibly vod links).
        <br>
        It may be added in the future. Feel free to ping aj asking him to add extra metadata for this show!
        <br>
        <br>
        Shows after July 28th, 2023 should have this extra metadata added automatically, but if it broke somehow, please ping aj!
    {/if}

    {#if data.metadata.vods?.floatplane}
        <a href="https://floatplane.com/post/{data.metadata.vods.floatplane}" target="_blank" rel="noreferrer">
            <Floatplane/> VOD on Floatplane
        </a>
    {/if}
    <br>
    {#if data.metadata.vods?.youtube}
        <a href="https://youtube.com/watch?v={data.metadata.vods.youtube}" target="_blank" rel="noreferrer">
            <Youtube/> VOD on Youtube
        </a>
    {/if}
</div>

<style>
    .big-wrapper {
        margin-top: 2em;
    }

    .thumbnail {
        height: min(15em, 50vw);
        @apply mx-auto;
    }
</style>