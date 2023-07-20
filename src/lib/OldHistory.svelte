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

    <span class="opacity-50 thats-all">
        <h2>That's all for now!</h2>
        More older shows will be added here eventually<br>
        <br>
        If you want to help add old shows,
        <a href="https://github.com/ajgeiss0702/wheniswan/wiki/Contributing-old-times" target="_blank" rel="noreferrer">
            you can!
        </a>
    </span>
{/await}

<style>
    .old-show-loading {
        padding-bottom: 90vh;
    }
    .thats-all {
        padding-bottom: 20vh;
    }
</style>