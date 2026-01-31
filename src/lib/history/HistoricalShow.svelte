<script lang="ts" module>

    // lazy loaders are split into groups, because having too many individual groups causes slowdowns

    import { type Writable, writable } from "svelte/store";

    const lazyLoadGroups: {[key: number]: Writable<{thumbnailLoaded?: boolean}>} = {};

</script>
<script lang="ts">
    import { getClosestWan, getTimeUntil, timeString } from "../timeUtils";
    import Late from "../Late.svelte";
    import Live from "$lib/history/Live.svelte";
    import { page } from "$app/state";
    import BlurHash from "$lib/history/BlurHash.svelte";
    import {fade} from "svelte/transition";
    import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";
    import { browser, dev } from "$app/environment";
    import { onMount } from "svelte";
    import { getDateFormatLocale, getTimePreference } from "$lib/prefUtils.ts";
    import type { AlternateTimeRow } from "../../routes/api/alternateStartTimes/+server.ts";




  interface Props {
    show: any;
    withThumbnail?: boolean;
    lazyLoadThumbnail?: boolean;
    onlyTimes?: boolean;
    alternateStartTimes: AlternateTimeRow[];
    lazyLoadGroup?: any;
  }

  let {
    show,
    withThumbnail = false,
    lazyLoadThumbnail = false,
    onlyTimes = false,
    alternateStartTimes,
    lazyLoadGroup = lazyLoadThumbnail ? Math.random() : -1
  }: Props = $props();

    let isLazyLoadTrigger = $state(false);
    if(lazyLoadThumbnail && !lazyLoadGroups[lazyLoadGroup]) {
        lazyLoadGroups[lazyLoadGroup] = writable({})
        isLazyLoadTrigger = true;
    }
    const groupStore = lazyLoadGroups[lazyLoadGroup];

    let nonLazyLoadedImage: HTMLImageElement | undefined = $state();
    let thumbnailLoaded = $state(nonLazyLoadedImage ? nonLazyLoadedImage.complete : false);

    let href = $derived(onlyTimes ? undefined : "/history/show/" + show.name);

    const snippet = show.value?.snippet ?? show.metadata?.snippet;

    const findThumbnailsAt = snippet ?? show.metadata
    const thumbnail = findThumbnailsAt?.thumbnails?.maxres ??
      findThumbnailsAt?.thumbnails?.standard ??
      findThumbnailsAt?.thumbnails?.high ??
      findThumbnailsAt?.thumbnails?.medium ??
      findThumbnailsAt?.thumbnails?.default

    const preShowStart = show.metadata.preShowStart ? new Date(show.metadata.preShowStart) : show.metadata.preShowStart;
    const mainShowStart = show.metadata.mainShowStart ? new Date(show.metadata.mainShowStart) : show.metadata.mainShowStart;
    const showEnd = show.metadata.showEnd ? new Date(show.metadata.showEnd) : show.metadata.showEnd;

    const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart ?? showEnd ?? snippet?.publishedAt), alternateStartTimes);

    const preShowLength = preShowStart && mainShowStart ?
      getTimeUntil(mainShowStart, preShowStart.getTime()).string :
      null;
    const mainShowLength = mainShowStart && showEnd ?
      getTimeUntil(showEnd, mainShowStart.getTime()).string :
      (show.metadata?.mainShowLength ? timeString(show.metadata.mainShowLength) : null);

    const onTimeDistance = mainShowStart ? (showDate.getTime() - mainShowStart.getTime()) : null;
    const onTime = mainShowStart ? getTimeUntil(showDate, mainShowStart.getTime()) : null;

    onMount(() => {
        if(nonLazyLoadedImage) thumbnailLoaded = nonLazyLoadedImage.complete
    })
</script>

<svelte:element this={href ? "a" : "div"}
  class:card={!onlyTimes}
  class="inline-block limit p-3 m-2 hidden-link relative"
  {href}
  id={show.name}
  class:highlight={!onlyTimes && page.url.hash === "#" + show.name}
>
    {#if !onlyTimes}
        {#if withThumbnail && thumbnail}
            <div class="thumbnail relative">
                {#if lazyLoadThumbnail}
                    <div class="thumbnail-space relative">
                        {#if dev}
                            {isLazyLoadTrigger} {lazyLoadGroup}
                        {/if}
                        {#if isLazyLoadTrigger && !$groupStore.thumbnailLoaded}
                            <LargerLazyLoad on:visible={() => {console.debug("Showing group", lazyLoadGroup); $groupStore.thumbnailLoaded = true;}}/>
                        {/if}
                        {#if $groupStore.thumbnailLoaded}
                            <div class="absolute top-0 left-0">
                                <img src={thumbnail.url} aria-hidden="true" alt={thumbnail.text ?? ""} title={thumbnail.text ?? ""} onload={() => thumbnailLoaded = true}>
                            </div>
                            {#if !thumbnailLoaded && browser && localStorage.getItem("disableBlurHash") !== "true"}
                                <div class="absolute top-0 left-0 rounded" out:fade|global={{duration: 400}}>
                                    {#if thumbnail.blurhash}
                                        <BlurHash blurhash={thumbnail.blurhash}/>
                                    {/if}
                                </div>
                            {/if}
                        {/if}
                    </div>
                {:else}
                    <img src={thumbnail.url} aria-hidden="true" alt={thumbnail.text ?? ""} onload={() => thumbnailLoaded = true} bind:this={nonLazyLoadedImage}>
                    {#if !thumbnailLoaded}
                        <div class="absolute top-0 left-0 rounded" out:fade|global={{duration: 200}}>
                            <img class="blur-sm" fetchpriority="high" src={(dev ? "https://whenplane.com" : "") + "/cdn-cgi/image/height=260,quality=10,format=auto,blur=20/" + thumbnail.url} aria-hidden="true" alt={thumbnail.text ?? ""}>
                        </div>
                    {/if}
                {/if}
                {#if show.metadata?.isCurrentlyLive}
                    <div class="inline-block absolute bottom-3 right-3">
                        <Live/>
                    </div>
                {/if}
            </div>
        {/if}
        <h3>{showDate.toLocaleDateString(getDateFormatLocale())}</h3>
        {#if !(withThumbnail && thumbnail) && show.metadata?.isCurrentlyLive}
            <div class="inline-block absolute top-3 right-3">
                <Live/>
            </div>
        {/if}
        {#if show.metadata.title}
            <h4>{show.metadata.title}</h4>
        {/if}
    {/if}
    <span class="hidden">name date (for debugging purposes): {show.name}</span>
    <hr>
    <div class="inline-block mr-2">
        <h4>Pre Show</h4>
        <span class="time">
            {#if preShowStart}
                {preShowStart.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        -
        <span class="time">
            {#if mainShowStart}
                {mainShowStart.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        <br>
        {#if preShowLength}
            {preShowLength}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
    </div>
    <div class="inline-block ml-2">
        <h4>Main Show</h4>
        <span class="time">
            {#if mainShowStart}
                {mainShowStart.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        -
        <span class="time">
            {#if showEnd}
                {showEnd.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        <br>
        {#if mainShowLength}
            {mainShowLength}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
    </div>
    <hr>
    {#if onTime && onTimeDistance}
        <!-- Allow up to 5 minutes early/late to count as on-time -->
        {#if onTimeDistance < 5 * 60e3 && onTimeDistance > -5 * 60e3}
            <span class="green">
                On time!
            </span>
        {:else}
            {#if onTime.late}
                <span class="red">
                    {onTime.string} <Late/>
                </span>
            {:else}
                <span class="green">
                    {onTime.string} early
                </span>
            {/if}
        {/if}
    {:else}
        <span class="opacity-50">
            N/A
        </span>
    {/if}
</svelte:element>
<style>


    .thumbnail-space {
        width: min(28.5rem, 95vw);
        aspect-ratio: 16 / 9;
        max-width: 100%;
    }

    img, .fake-img {
        width: min(28.5em, 95vw);
        object-fit: cover;
        border-radius: var(--theme-rounded-base);
        aspect-ratio: 16 / 9;
    }

    .highlight {
        border: 1px solid darkgoldenrod;
    }


    .red {
        color: red;
    }
    .green {
        color: green;
    }
    .time {
        font-size: 1.25em;
        font-family: monospace;
    }
    a {
        width: min(30rem, 95vw);
    }
    .rounded {
        border-radius: var(--theme-rounded-base);
        overflow: hidden;
    }
</style>