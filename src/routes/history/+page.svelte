<script>
    import HistoricalShow from "../../lib/HistoricalShow.svelte";
    import OldHistory from "../../lib/OldHistory.svelte";

    export let data;

    console.log(data)
</script>
<svelte:head>
    <title>WAN Show History</title>
</svelte:head>
<div class="text-center">
    <h1 class="text-center mt-4">WAN Show History</h1>

    <div class="inline-block">
        {#each data.history.currentYear as show}
            <HistoricalShow {show}/><br>
        {:else}
            None yet!
        {/each}
        <OldHistory/>
    </div>
</div>
