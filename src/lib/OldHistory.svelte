<script>
    import HistoricalShow from "./HistoricalShow.svelte";
    import LazyLoad from '@dimfeld/svelte-lazyload';

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let fetchingHistory = new Promise(() => {});
</script>
<LazyLoad on:visible={() => fetchingHistory = import("./oldHistory.ts")}/>
{#await fetchingHistory}
    <span class="opacity-50 old-show-loading">
        Loading older shows..
    </span>
{:then {history}}
    {#each history as show}
        <HistoricalShow {show}/><br>
    {:else}
        <span class="opacity-50">
            No old shows?
        </span>
    {/each}

    <br>
    <br>
    <br>
    <br>

    <span class="opacity-50">
        <h2>That's all for now!</h2>
        More older shows will be added here eventually
    </span>
{/await}

<style>
    .old-show-loading {
        padding-bottom: 90vh;
    }
</style>