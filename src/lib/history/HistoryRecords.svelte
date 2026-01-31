<script lang="ts">
    import { run } from 'svelte/legacy';

    import {dev} from "$app/environment";
    import Record from "$lib/history/Record.svelte";
    import LoadingRecord from "$lib/history/LoadingRecord.svelte";
    import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
    import { onMount } from "svelte";
    import GraphUp from "svelte-bootstrap-icons/lib/GraphUp.svelte";
    import { page } from "$app/state";


    let { records = $bindable(), data } = $props();

    run(() => {
        if(data) records = data.history.records;
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let latenessesFetching = $state(new Promise(() => {}));
    let latenessesFetched = false;

    function fetchLatenesses() {
        if(latenessesFetched) return;
        latenessesFetched = true;
        latenessesFetching = fetch("/api/latenesses").then(r => r.json());
    }
    onMount(() => {
        if(dev) fetchLatenesses();
    })

</script>
<div class="p-1">
    <div class="card limit mx-auto pb-4 pt-2 relative">
        <a class="hidden-link absolute right-5 top-5" href="/history/graph">
            <GraphUp/>
        </a>
        <h2>Records and Stats</h2>
        {#await records}
            <LoadingRecord>
                Earliest Show
            </LoadingRecord>
            <LoadingRecord>
                Most late show
            </LoadingRecord>
            <Accordion>
                <AccordionItem>
                    {#snippet summary()}
                                        More records/stats
                                    {/snippet}
                    {#snippet content()}
                                        Loading...
                                    {/snippet}
                </AccordionItem>
            </Accordion>
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
            <Accordion class="mx-4" spacing="" regionPanel="">
                <AccordionItem on:toggle={fetchLatenesses}>
                    {#snippet summary()}
                                        More records/stats
                                    {/snippet}
                    {#snippet content()}
                                    
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
                            {#await rec.shortestPreShow}
                                <LoadingRecord>
                                    Shortest pre-show
                                </LoadingRecord>
                            {:then record}
                                <Record {record}>
                                    Shortest pre-show
                                </Record>
                            {/await}
                            {#await rec.shortestShow}
                                <LoadingRecord>
                                    Shortest main show
                                </LoadingRecord>
                            {:then record}
                                <Record {record}>
                                    Shortest main show
                                </Record>
                            {/await}

                            {#await rec.lateStreak}
                                <LoadingRecord>
                                    Late Streak
                                    {#snippet description()}
                                                            
                                            <span class="opacity-75 text-90 relative bottom-1">Late shows in a row</span>
                                        
                                                            {/snippet}
                                </LoadingRecord>
                            {:then record}
                                <Record {record} asTime={false}>
                                    Late Streak
                                    {#snippet description()}
                                                            
                                            <span class="opacity-75 text-90 relative bottom-1">Late shows in a row</span>
                                        
                                                            {/snippet}
                                </Record>
                            {/await}
                            {#await rec.showStreak}
                                <LoadingRecord>
                                    Show Streak
                                    {#snippet description()}
                                                            
                                            <span class="opacity-75 text-90 relative bottom-1">Shows aired without missing a week</span>
                                        
                                                            {/snippet}
                                </LoadingRecord>
                            {:then record}
                                <Record {record} asTime={false}>
                                    Show Streak
                                    {#snippet description()}
                                                            
                                            <span class="opacity-75 text-90 relative bottom-1">Shows aired without missing a week</span>
                                        
                                                            {/snippet}
                                </Record>
                            {/await}

                            {#await latenessesFetching}
                                <LoadingRecord>
                                    Average lateness
                                </LoadingRecord>
                                <LoadingRecord>
                                    Median lateness
                                </LoadingRecord>
                            {:then latenesses}
                                {#if latenesses.averageLateness || dev}
                                    <Record record={latenesses.averageLateness} late={true} color={false}>
                                        Average lateness
                                        {#snippet description()}
                                                                    
                                                <span class="opacity-75 text-90 relative bottom-1">from the last 5 shows</span>
                                            
                                                                    {/snippet}
                                    </Record>
                                {/if}
                                {#if latenesses.medianLateness || dev}
                                    <Record record={latenesses.medianLateness} late={true} color={false}>
                                        Median lateness
                                        {#snippet description()}
                                                                    
                                                <span class="opacity-75 text-90 relative bottom-1">from the last 5 shows</span>
                                            
                                                                    {/snippet}
                                    </Record>
                                {/if}
                            {/await}
                            <div class="opacity-75">
                                If you have any ideas for new records or stats, feel free to suggest them.<br>
                                I'm ajgeiss0702 on floatplane and discord, or you can email me at <a href="mailto:aj@whenplane.com?subject=Record%2Fstat%20suggestion">aj@whenplane.com</a>
                            </div>
                        
                                    {/snippet}
                </AccordionItem>
            </Accordion>
        {/await}
    </div>
</div>