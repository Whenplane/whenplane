<script lang="ts" module>
    let pageIndex = $state(0);
</script>
<script lang="ts">
    import HistoricalShow from "$lib/history/HistoricalShow.svelte";
    import { browser, dev } from "$app/environment";
    import HistoryRecords from "$lib/history/HistoryRecords.svelte";
    import LinusFace from "$lib/history/LinusFace.svelte";
    import { SegmentedControl } from "@skeletonlabs/skeleton-svelte";
    import { setCookie } from "$lib/cookieUtils";

    import ViewStacked from "svelte-bootstrap-icons/lib/ViewStacked.svelte"
    import CardImage from "svelte-bootstrap-icons/lib/CardImage.svelte"
    import Images from "svelte-bootstrap-icons/lib/Images.svelte"
    import Grid from "svelte-bootstrap-icons/lib/Grid.svelte"
    import Search from "svelte-bootstrap-icons/lib/Search.svelte"
    import { countTo, type HistoricalEntry } from "$lib/utils";
    import LoadingHistoricalShow from "$lib/history/LoadingHistoricalShow.svelte";
    import LazyLoad from "@dimfeld/svelte-lazyload";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let { data } = $props();

    console.debug({data})

    let shows = $state(data.history.shows);

    let nextYear = $state(data.history.lowestYear - 1);

    let view = $state((data.history.viewType ?? 0)+"");

    let first = $state(true);
    $effect(() => {
        if(first) {
            first = false;
        } else if(browser) {
            setCookie("historyViewType", view+"");
        }
    });
    let laterPages: Promise<HistoricalEntry[]>[] = $state([]);

    let lastNewPage = 0;
    function loadNextYear() {
        if(Date.now() - lastNewPage < 500) return;
        lastNewPage = Date.now();
        if(nextYear < 2012) return;
        const yearToFetch = nextYear--;
        console.debug("Fetching", yearToFetch)
        laterPages.push(
          fetch("/api/history/year/" + yearToFetch)
            .then(r => r.json() as Promise<HistoricalEntry[]>)
        )
    }
    $effect(() => console.debug({nextYear}))

    let mounted = $state(false);
    onMount(() => {
        mounted = true;
    })

    if(browser) pageIndex++;
</script>
<svelte:head>
    <title>WAN Show History</title>
    <meta name="description" content="How late has the WAN show been before? (spoiler: very!) See a list of every WAN show that has ever happened, and when they started."/>
    <link rel="canonical" href="https://whenplane.com{page.url.pathname}"/>
</svelte:head>
<a href="/" class="pt-2 pl-2">Back to Countdown</a>
<div class="text-center">
    <h1 class="text-center">WAN Show History</h1>

    <HistoryRecords {data}/>

    <br>

    <a href="/search" class="btn preset-tonal-primary border border-primary-500 text-white rounded-2xl">
        <Search/>
         
        Search for Shows
    </a><br>

    <br>
    <div class="flex flex-col items-center gap-4 mb-2">
        <SegmentedControl value={view} onValueChange={(details) => (view = details.value ?? "0")} name="justify">
            <SegmentedControl.Control>
                <SegmentedControl.Indicator />
                <SegmentedControl.Item value="0">
                    <SegmentedControl.ItemText class="inline-block">
                        <Images/>
                    </SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="1">
                    <SegmentedControl.ItemText class="inline-block">
                        <CardImage/>
                    </SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="2">
                    <SegmentedControl.ItemText class="inline-block">
                        <ViewStacked/>
                    </SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="3">
                    <SegmentedControl.ItemText class="inline-block">
                        <Grid/>
                    </SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
            </SegmentedControl.Control>
        </SegmentedControl>
    </div>

    <div class={[
      "inline-flex flex-wrap justify-center",
      view === "0" && "thumbnail-inline",
      view === "1" && "thumbnail-list inline-block!",
      view === "2" && "old-layout inline-block!",
      view === "3" && "thumbnailless-inline",
    ]}
    >
        {#snippet showComponent(show: HistoricalEntry, i: number)}
            <HistoricalShow {show} withThumbnail={Number(view) < 2} lazyLoadThumbnail={i > 10} lazyLoadGroup={Math.floor(i/8) + (1000 * pageIndex)} alternateStartTimes={data.alternateStartTimes}/>
        {/snippet}
        {#each shows as show, i (show.name)}
            {@render showComponent(show, i)}
            {#if i === 50}
                <LinusFace/>
            {/if}
        {/each}
        {#each laterPages as page, pi (pi)}
            {#await page}
                {#each countTo(52) as _}
                    <LoadingHistoricalShow withThumbnail={Number(view) < 2}/>
                {/each}
            {:then year}
                {#each year as show, si (show.name)}
                    {@render showComponent(show, shows.length + (pi * 52) + si)}
                {/each}
            {/await}
        {/each}

        {#if nextYear >= 2012}
            <div style="height: 0; display: inline-block;">
                <div class="relative pointer-events-none" style="bottom: 50em">
                    {#if mounted}
                        {#key laterPages.length}
                            <LazyLoad on:visible={loadNextYear} height="50em"/>
                        {/key}
                    {/if}
                </div>
            </div>

            {#each countTo(20) as _}
                <LoadingHistoricalShow withThumbnail={Number(view) < 2}/>
            {/each}
        {:else}
            <div class="w-full mt-32 mb-64 opacity-50">
                <h2>That's it!</h2>
                You've reached the very beginning.<br>
            </div>
        {/if}
    </div>
</div>

<style>

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
