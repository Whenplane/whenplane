<script lang="ts">
    import HistoricalShow from "./HistoricalShow.svelte";
    import LazyLoad from '@dimfeld/svelte-lazyload';
    import {fade} from "svelte/transition";
    import { quadInOut } from "svelte/easing";
    import { page } from "$app/stores";
    import { countTo } from "$lib/utils";
    import LoadingHistoricalShow from "$lib/history/LoadingHistoricalShow.svelte";

    interface Props {
        withThumbnail?: boolean;
    }

    let { withThumbnail = false }: Props = $props();

    let alreadyLoaded = false;
    let fetchingHistory = $state((() => {
        if($page.data?.history?.oldHistory) {
            alreadyLoaded = true;
            return $page.data?.history?.oldHistory;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return new Promise(() => {});
        }
    })());


    function loadHistory() {
        if(alreadyLoaded) return;
        fetchingHistory = import("./oldHistory.ts");
        alreadyLoaded = true;
    }
</script>
<div style="height: 0; display: inline-block;" id="old-history">
    <div class="relative pointer-events-none" style="bottom: 50em">
        <LazyLoad on:visible={loadHistory} height="50em"/>
    </div>
</div>

{#await fetchingHistory}
    <span class="opacity-50 old-show-loading">
        <div class="loading-shows-container">
            {#each countTo(20) as i}
                <LoadingHistoricalShow {withThumbnail}/>
            {/each}
        </div>
        <br>
        <span class="opacity-50">
            Loading...
        </span>
    </span>
    <div style="height: 0; display: inline-block;" id="old-history">
        <div class="relative pointer-events-none" style="bottom: 50em">
            <LazyLoad on:visible={loadHistory} height="50em"/>
        </div>
    </div>
{:then {history}}
    {#each history as show, i}
        <span in:fade|global={{delay: i > 50 ? 0 : i * 50, duration: 350, easing: quadInOut}}>
            <HistoricalShow {show} {withThumbnail} lazyLoadThumbnail={true}/>
        </span>
    {:else}
        <span class="opacity-50">
            No old shows?
        </span>
    {/each}

    <br>
    <br>
    <br>
    <br>

    <span class="opacity-50 thats-all">
        <h2>That's it!</h2>
        You've reached the very beginning.<br>
    </span>
{/await}

<style>
    .old-show-loading {
        padding-bottom: 90vh;
    }
    .thats-all {
        padding-bottom: 20vh;
    }
    .loading-shows-container {
        display: inline;
        max-height: 100vh;
        overflow-y: hidden;
    }
</style>