<script lang="ts">
    import HistoricalShow from "$lib/history/HistoricalShow.svelte";
    import { colonTimeString, getClosestWan, timeString } from "$lib/timeUtils";
    import Floatplane from "$lib/svg/Floatplane.svelte";
    import Youtube from "$lib/svg/Youtube.svelte";
    import {getTimeUntil} from "$lib/timeUtils";
    import { browser, dev } from "$app/environment";
    import { page } from "$app/stores";
    import type { WanDb_Topic } from "$lib/wdb_types.ts";
    import SubTopics from "$lib/subcomponents/SubTopics.svelte";
    import { fade } from "svelte/transition";

    import { getDateFormatLocale } from "$lib/prefUtils.ts";
    import { truncateText } from "$lib/utils.js";
    import { getCookie, setCookie } from "$lib/cookieUtils.ts";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import Incomplete from "$lib/merch-messages/Incomplete.svelte";

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

    const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt ?? data.name));

    const backHash =  `?to=${showDate.getUTCFullYear()}#` + data.name;

    let onTimeUntil = data.metadata.mainShowStart ? getTimeUntil(showDate, new Date(data.metadata.mainShowStart).getTime()) : null;

    const preShowLength = preShowStart && mainShowStart ?
      getTimeUntil(mainShowStart as Date, (preShowStart as Date).getTime()).distance/1e3 :
      null;

    let timestampPlatform: string | null;
    timestampPlatform = (browser ? getCookie("timestampPlatform") : $page.params.__c__timestampPlatform) ?? "youtube"; // seperate so it doesnt try to react

    function toggleTimestampPlatform() {
        const before = getCookie("timestampPlatform");
        if(before === "floatplane") {
            timestampPlatform = "youtube";
        } else {
            timestampPlatform = "floatplane";
        }
        setCookie("timestampPlatform", timestampPlatform)
    }

    let onTimeString: string;
    $: if(onTimeUntil) onTimeString = onTimeUntil.distance < 5 * 60e3 ? "on time!" : (onTimeUntil.late ? onTimeUntil.string + "late" : onTimeUntil.string + "early!");


    $: description = "WAN show from " + showDate.toLocaleDateString(undefined, {dateStyle: 'long'}) +
      (data.metadata.title ? " titled '" + truncateText(data.metadata.title.trim(), 65) + "'" : "") + ". " +
      (onTimeString ? 'It was ' + onTimeString.trim() : '') +
      ((mainShowStart instanceof Date && showEnd instanceof Date) || data.metadata.mainShowLength ? (onTimeString ? ", and" : "It") + " was live for " + timeString(data.metadata.mainShowLength ?? (showEnd?.getTime() - mainShowStart?.getTime()))?.trim() + "." : ".");
</script>
<svelte:head>
    <title>{data.metadata.title ?? ""}{data.metadata.title ? " - " : ""} {showDate.toLocaleDateString(undefined, {dateStyle: 'long'})}</title>
    <meta name="description" content={(description.length < 110 ? "The " : "") + description}>
    {#if thumbnail}
        <meta property="og:image" content={thumbnail.url}>
    {/if}
</svelte:head>

<span class="clear inline-block absolute pointer-events-none" style="z-index: -5;">
    {description}
</span>

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
    <li class="crumb"><a class="anchor hover-underline" href="/history{backHash}">{showDate.toLocaleDateString(getDateFormatLocale())}</a></li>
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
        <a href="https://www.floatplane.com/post/{data.metadata.vods.floatplane}" target="_blank" rel="noopener">
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

    {#await data.mm}
    {:then mm}
        {#if mm}
            <div in:fade={{duration: 100}}>
                <h2>Merch Messages</h2>
                {#if mm.messageCount}
                    Whenplane found {mm.messageCount} merch messages for this show.
                {/if}<br>
                <a href="/merch-messages/{mm.videoId}">View Merch Messages</a><br>

                {#if mm.status === "inprogress"}
                    <br>
                    <Incomplete/>
                {/if}

                <br>
                <br>
            </div>
        {/if}
    {/await}

    {#if data.timestamps}
        {#await data.timestamps}
        {:then timestamps}
            {#if timestamps && timestamps.length > 0}
                <h2>Timestamps</h2>
                Provided by <a href="/noki">NoKi</a>
                <div class="flex justify-center items-center mt-2">
                    <Youtube/>
                    <SlideToggle checked={timestampPlatform === "floatplane"} on:change={toggleTimestampPlatform}/>
                    <Floatplane/>
                </div>
                <div in:fade={{duration: 100}} class="text-left inline-block mx-auto">
                    <ol class="normal-list">
                        {#each timestamps as timestamp, i}
                            {@const youtubeId = data.value?.vods?.youtube}
                            {@const floatplaneId = data.value?.vods?.floatplane}
                            <li class="!mt-0 !mb-0 !p-0" id="timestamp-{youtubeId}.{timestamp.time}" class:highlighted={$page.url.hash === "#timestamp-" + youtubeId + "." + timestamp.time}>
                                <a
                                  class="hidden-link"
                                  href={
                                  timestampPlatform === "floatplane" && preShowLength ?
                                  `https://www.floatplane.com/post/${floatplaneId}?t=${timestamp.time + preShowLength}` :
                                  `https://youtube.com/watch?v=${youtubeId}&t=${timestamp.time}`
                                  }
                                  rel="noopener"
                                >
                                    <span class="opacity-70">
                                      {#if timestampPlatform === "floatplane" && preShowLength}
                                          {colonTimeString(timestamp.time + preShowLength)}
                                      {:else}
                                          {timestamp.timeString}
                                      {/if}
                                    </span>
                                    {timestamp.name}
                                </a>

                                {#if timestamp.subTimestamps && timestamp.subTimestamps.length > 0}
                                    <SubTopics subTopics={timestamp.subTimestamps} {youtubeId} {floatplaneId} {preShowLength} floatplane={timestampPlatform === "floatplane"}/>
                                {/if}

                            </li>
                        {/each}
                    </ol>
                </div>
            {/if}

        {/await}
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

    .highlighted {
        border: solid 2px rgba(255, 255, 0, 0.5);
        border-radius: 4px;
        padding: 2px;
    }
</style>