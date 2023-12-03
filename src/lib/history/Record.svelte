<script lang="ts">
    import {getClosestWan, timeString} from "$lib/timeUtils";
    import Late from "$lib/Late.svelte";
    export let record: BestShow | number;
    export let color = true;
    export let late = false;
    export let early = false;

    export let selected = false;

    export let loading = false;
</script>

<div class="box text-center" class:selected={selected}>
    <h3><slot/></h3>
    <div>
        <slot name="description"></slot>
    </div>
    {#if record}
        <span class:late={late && color} class:early={early && color}>
            {timeString(Math.abs(typeof record === 'number' ? record : record.distance))}
            {#if late}
                <Late/>
            {/if}
            {#if early}
                early
            {/if}
        </span>
        <br>
        {#if record.name}
            <span class="small">
                <a href="/history/show/{record.name}" class="hidden-link underline">
                    {getClosestWan(new Date(record.name)).toLocaleDateString()}
                </a>
            </span>
        {/if}
    {:else if loading}
        <span class="placeholder animate-pulse inline-block w-48"></span>
        <span class="small placeholder animate-pulse inline-block w-32"></span>
    {:else}
        <span class="opacity-50">N/A</span>
    {/if}
</div>

<style>
    .box {
        @apply inline-block border-token border-surface-400-500-token p-2 m-1 mb-2 rounded-md;
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

    .placeholder {
        height: 1.25em !important;
    }

    .selected {
        background-color: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2) !important;
    }
</style>