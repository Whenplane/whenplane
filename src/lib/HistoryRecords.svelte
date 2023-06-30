<script lang="ts">
    import {dev} from "$app/environment";
    import Record from "$lib/Record.svelte";

    export let records;

    let closest: BestShowTime = records.closest;
    let mostLate: BestShow = records.mostLate;
    let longestPreShow: BestShow = records.longestPreShow;
    let longestShow: BestShow = records.longestShow;

</script>
<div class="p-1">
    <div class="card limit mx-auto pb-4 pt-2">
        <h2>Records</h2>
        Note that all of the WAN show times have not been recorded.<br>
        These are only what can be seen on this page.
        <br>
        {#if dev && (!closest || !longestPreShow || !longestShow || !mostLate)}
        <span class="box">
            <h2>Missing records</h2>
            You're in dev but dont appear to have records loaded!<br>
            <a href="/api/dev/fetch">fetch data from prod</a>
            <br>
        </span>
            <br>
        {/if}
        <Record record={closest} late={closest?.distance > 0} early={closest?.distance <= 0}>
            Earliest show
        </Record>
        <Record record={mostLate} late={true}>
            Most late show
        </Record>
        <br>
        <Record record={longestPreShow}>
            Longest pre-show
        </Record>
        <Record record={longestShow}>
            Longest main show
        </Record>
    </div>
</div>