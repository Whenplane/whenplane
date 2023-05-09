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

    <br>
    <br>
    <br>
    <br>

    <span class="opacity-50">
        <h2>That's all for now!</h2>
        More older shows will be added here eventually
    </span>
{/await}