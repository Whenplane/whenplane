<script>
    import HistoricalShow from "$lib/HistoricalShow.svelte";
    import OldHistory from "$lib/OldHistory.svelte";
    import {dev} from "$app/environment";
    import HistoryRecords from "$lib/HistoryRecords.svelte";
    import Record from "$lib/Record.svelte";
    import LoadingRecord from "$lib/LoadingRecord.svelte";

    export let data;

    console.log({data})

</script>
<svelte:head>
    <title>WAN Show History</title>
</svelte:head>
<a href="/" class="pt-2 pl-2">Back to Countdown</a>
<div class="text-center">
    <h1 class="text-center">WAN Show History</h1>

    <HistoryRecords {data}/>

    <br>

    <div class="inline-block">
        {#each data.history.currentYear as show}
            <HistoricalShow {show}/><br>
        {/each}
        {#if dev}
            <hr>
        {/if}
        <OldHistory/>
        <br>
        <br>
        <br>
    </div>
</div>
