<script>
    import {browser} from "$app/environment";
    import HistoricalShow from "./HistoricalShow.svelte";

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const fetchingHistory = browser ? import("./oldHistory.ts") : new Promise(() => {})
</script>
{#await fetchingHistory}
    <span class="opacity-50">
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
{/await}