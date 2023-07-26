<script lang="ts">
    import HistoricalShow from "$lib/HistoricalShow.svelte";
    import {getClosestWan} from "$lib/timeUtils";
    import Floatplane from "$lib/svg/Floatplane.svelte";
    import Youtube from "$lib/svg/Youtube.svelte";
    import {getTimeUntil} from "$lib/timeUtils";

    export let data;

    const showDate = getClosestWan(new Date(data.metadata.preShowStart ?? data.metadata.mainShowStart));

    let onTimeUntil = data.metadata.mainShowStart ? getTimeUntil(showDate, new Date(data.metadata.mainShowStart).getTime()) : null;

    let onTimeString;
    $: if(onTimeUntil) onTimeString = onTimeUntil.distance < 5 * 60e3 ? "on time!" : (onTimeUntil.late ? onTimeUntil.string + "late" : onTimeUntil.string + "early!");
</script>
<svelte:head>
    <title>{data.metadata.title ?? ""}{data.metadata.title ? " - " : ""}WAN Show {showDate.toLocaleDateString()}</title>
    <meta name="description" content="WAN show from {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})}. {onTimeString ? 'It was ' + onTimeString : ''}">
</svelte:head>

<!--<pre>{JSON.stringify(data, null, "\t")}</pre>-->

<div class="text-center limit mx-auto big-wrapper">
    <h1>{showDate.toLocaleDateString(undefined, {dateStyle: "long"})}</h1>
    {#if data.metadata.snippet?.thumbnails?.maxres}
        <br>
        <img class="thumbnail" src={data.metadata.snippet?.thumbnails?.maxres.url} alt="Thumbnail for show"/>
    {/if}
    {#if data.metadata.title}
        <h2>{data.metadata.title}</h2>
    {/if}

    <HistoricalShow onlyTimes={true} show={data} bind:onTimeUntil={onTimeUntil}/>
    <br>

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