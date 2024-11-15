<script lang="ts" context="module">
    let pageIndex = 0;
</script>
<script lang="ts">
    import HistoricalShow from "$lib/history/HistoricalShow.svelte";
    import { browser, dev } from "$app/environment";
    import HistoryRecords from "$lib/history/HistoryRecords.svelte";
    import LinusFace from "$lib/history/LinusFace.svelte";
    import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";
    import { setCookie } from "$lib/cookieUtils";

    import ViewStacked from "svelte-bootstrap-icons/lib/ViewStacked.svelte"
    import CardImage from "svelte-bootstrap-icons/lib/CardImage.svelte"
    import Images from "svelte-bootstrap-icons/lib/Images.svelte"
    import Grid from "svelte-bootstrap-icons/lib/Grid.svelte"
    import { countTo, type HistoricalEntry } from "$lib/utils";
    import LoadingHistoricalShow from "$lib/history/LoadingHistoricalShow.svelte";
    import LazyLoad from "@dimfeld/svelte-lazyload";
    import TopicSearch from "$lib/TopicSearch.svelte";

    export let data;

    console.debug({data})

    let shows = data.history.shows;

    let nextYear = data.history.lowestYear - 1;

    let view = data.history.viewType ?? 0;

    let first = true;
    $: {
        if(first) {
            first = false;
        } else if(browser) {
            setCookie("historyViewType", view+"");
        }
    }

    function loadNextYear() {
        console.debug("Fetching", nextYear)
        fetch("/api/history/year/" + nextYear)
          .then(r => r.json() as Promise<HistoricalEntry[]>)
          .then(newShows => {
              console.debug("Adding " + newShows.length + " shows from " + newShows[0]?.name.split("/")[0])
              shows.push(...newShows);
              shows = shows;
              nextYear--;
          })
    }

    if(browser) pageIndex++;
</script>
<svelte:head>
    <title>WAN Show History</title>
    <meta name="description" content="How late has the WAN show been before? (spoiler: very!) See a list of every WAN show that has ever happened, and when they started."/>
</svelte:head>
<a href="/" class="pt-2 pl-2">Back to Countdown</a>
<div class="text-center">
    <h1 class="text-center">WAN Show History</h1>

    <HistoryRecords {data}/>

    <br>

    <a href="/search" class="btn variant-ghost-primary">
        Search for Shows
    </a><br>

    <br>
    <RadioGroup>
        <RadioItem bind:group={view} name="justify" value={0}><Images/></RadioItem>
        <RadioItem bind:group={view} name="justify" value={1}><CardImage/></RadioItem>
        <RadioItem bind:group={view} name="justify" value={2}><ViewStacked/></RadioItem>
        <RadioItem bind:group={view} name="justify" value={3}><Grid/></RadioItem>
    </RadioGroup>
    <br>

    <div class="inline-block"
         class:thumbnail-inline={view === 0}
         class:thumbnail-list={view === 1}
         class:old-layout={view === 2}
         class:thumbnailless-inline={view === 3}
    >
        {#each shows as show, i (show.name)}
            <HistoricalShow {show} withThumbnail={view < 2} lazyLoadThumbnail={i > 10} lazyLoadGroup={Math.floor(i/6) + (1000 * pageIndex)}/>
            {#if i === 50}
                <LinusFace/>
            {/if}
        {/each}

        {#if nextYear >= 2012}
            <div style="height: 0; display: inline-block;">
                <div class="relative pointer-events-none" style="bottom: 50em">
                    {#key shows}
                        <LazyLoad on:visible={loadNextYear} height="50em"/>
                    {/key}
                </div>
            </div>

            <LazyLoad>
                {#each countTo(20) as i}
                    <LoadingHistoricalShow withThumbnail={view < 2}/>
                {/each}
            </LazyLoad>

            <div style="height: 0; display: inline-block;">
                <div class="relative pointer-events-none" style="bottom: 50em">
                    {#key shows}
                        <LazyLoad on:visible={loadNextYear} height="50em"/>
                    {/key}
                </div>
            </div>
        {:else}
            <br>
            <br>
            <br>
            <span class="opacity-50 thats-all">
                <h2>That's it!</h2>
                You've reached the very beginning.<br>
            </span>
        {/if}
        <br>
        <br>
        <br>
    </div>
</div>

<style>
    .thats-all {
        padding-bottom: 20vh;
    }

    :global(.old-layout > a) {
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
    :global(.thumbnail-list > a) {
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
</style>
