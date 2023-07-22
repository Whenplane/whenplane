<script lang="ts">
    import {dev} from "$app/environment";
    import Record from "$lib/Record.svelte";
    import LoadingRecord from "$lib/LoadingRecord.svelte";

    export let records;

    export let data;

    $: if(data) records = data.history.records;

</script>
<div class="p-1">
    <div class="card limit mx-auto pb-4 pt-2">
        <h2>Records</h2>
        Note that all of the WAN show times have not been recorded.<br>
        These are only what can be seen on this page.
        <br>
        {#await records}
            <LoadingRecord>
                Earliest Show
            </LoadingRecord>
            <LoadingRecord>
                Most late show
            </LoadingRecord>
            <br>
            <LoadingRecord>
                Longest pre-show
            </LoadingRecord>
            <LoadingRecord>
                Longest main show
            </LoadingRecord>
        {:then rec}
            {#if dev && (!rec.earliest || !rec.longestPreShow || !rec.longestShow || !rec.mostLate)}
            <span class="box">
                <h2>Missing records</h2>
                You're in dev but dont appear to have records loaded!<br>
                <a href="/api/dev/fetch">fetch data from prod</a>
                <br>
            </span>
                <br>
            {/if}
            {#await rec.earliest}
                <LoadingRecord>
                    Earliest Show
                </LoadingRecord>
            {:then record}
                <Record {record} late={record?.distance < 0} early={record?.distance >= 0}>
                    Earliest show
                </Record>
            {/await}
            {#await rec.mostLate}
                <LoadingRecord>
                    Most late show
                </LoadingRecord>
            {:then record}
                <Record {record} late={true}>
                    Most late show
                </Record>
            {/await}
            <br>
            {#await rec.longestPreShow}
                <LoadingRecord>
                    Longest pre-show
                </LoadingRecord>
            {:then record}
                <Record {record}>
                    Longest pre-show
                </Record>
            {/await}
            {#await rec.longestShow}
                <LoadingRecord>
                    Longest main show
                </LoadingRecord>
            {:then record}
                <Record {record}>
                    Longest main show
                </Record>
            {/await}
        {/await}
    </div>
</div>