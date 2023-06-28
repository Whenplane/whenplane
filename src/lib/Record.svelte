<script lang="ts">
    import {getClosestWan, timeString} from "$lib/timeUtils.js";
    import Late from "$lib/Late.svelte";

    export let record: BestShow;
    export let late = false;
    export let early = false;
</script>

<div class="box">
    <h3><slot/></h3>
    {#if record}
        <span class:late={late} class:early={early}>
            {timeString(record.distance)}
            {#if late}
                <Late/>
            {/if}
            {#if early}
                early!
            {/if}
        </span>
        <br>
        <span class="small">
            {getClosestWan(new Date(record.name)).toLocaleDateString()}
        </span>
    {:else}
        <span class="opacity-50">N/A</span>
    {/if}
</div>

<style>
    .box {
        @apply inline-block border-token border-surface-400-500-token p-2 m-1 rounded-md;
        width: 300px;
    }
    .small {
        @apply opacity-75;
        font-size: 0.75em;
    }

    .late {
        color: red;
    }
    .early {
        color: green;
    }
</style>