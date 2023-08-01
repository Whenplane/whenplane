<script>
    import {getClosestWan, getTimeUntil} from "./timeUtils";
    import Late from "./Late.svelte";

    export let show;

    export let onlyTimes = false;

    $: href = onlyTimes ? undefined : "/history/show/" + show.name;

    const preShowStart = show.metadata.preShowStart ? new Date(show.metadata.preShowStart) : show.metadata.preShowStart;
    const mainShowStart = show.metadata.mainShowStart ? new Date(show.metadata.mainShowStart) : show.metadata.mainShowStart;
    const showEnd = show.metadata.showEnd ? new Date(show.metadata.showEnd) : show.metadata.showEnd;

    const showDate = getClosestWan(new Date(preShowStart ?? mainShowStart));

    const preShowLength = preShowStart && mainShowStart ? getTimeUntil(mainShowStart, preShowStart.getTime()).string : null;
    const mainShowLength = mainShowStart && showEnd ? getTimeUntil(showEnd, mainShowStart.getTime()).string : null;

    const onTimeDistance = mainShowStart ? (showDate.getTime() - mainShowStart.getTime()) : null;
    const onTime = mainShowStart ? getTimeUntil(showDate, mainShowStart.getTime()) : null;
</script>

<a class:card={!onlyTimes} class="inline-block limit p-3 m-2 w-full hidden-link" {href}>
    {#if !onlyTimes}
        <h3>{showDate.toLocaleDateString()}</h3>
        {#if show.metadata.title}
            <h4>{show.metadata.title}</h4>
        {/if}
    {/if}
    <span class="hidden">name date (for debugging purposes): {show.name}</span>
    <hr>
    <div class="inline-block mr-2">
        <h4>Pre Show</h4>
        <span class="time">
            {#if preShowStart}
                {preShowStart.toLocaleTimeString(undefined, {timeStyle: "short"})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        -
        <span class="time">
            {#if mainShowStart}
                {mainShowStart.toLocaleTimeString(undefined, {timeStyle: "short"})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        <br>
        {#if preShowLength}
            {preShowLength}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
    </div>
    <div class="inline-block ml-2">
        <h4>Main Show</h4>
        <span class="time">
            {#if mainShowStart}
                {mainShowStart.toLocaleTimeString(undefined, {timeStyle: "short"})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        -
        <span class="time">
            {#if showEnd}
                {showEnd.toLocaleTimeString(undefined, {timeStyle: "short"})}
            {:else}
                <span class="opacity-50">
                    N/A
                </span>
            {/if}
        </span>
        <br>
        {#if mainShowLength}
            {mainShowLength}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
    </div>
    <hr>
    {#if onTime && onTimeDistance}
        <!-- Allow up to 5 minutes early/late to count as on-time -->
        {#if onTimeDistance < 5 * 60e3 && onTimeDistance > -5 * 60e3 }
            <span class="green">
                On time!
            </span>
        {:else}
            {#if onTime.late}
                <span class="red">
                    {onTime.string} <Late/>
                </span>
            {:else}
                <span class="green">
                    {onTime.string} early
                </span>
            {/if}
        {/if}
    {:else}
        <span class="opacity-50">
            N/A
        </span>
    {/if}
</a>
<style>
    .red {
        color: red;
    }
    .green {
        color: green;
    }
    .time {
        font-size: 1.25em;
        font-family: monospace;
    }
</style>