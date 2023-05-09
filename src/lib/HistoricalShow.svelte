<script>
    import {getClosestWan, getTimeUntil} from "./timeUtils";

    export let show;

    const preShowStart = new Date(show.metadata.preShowStart);
    const mainShowStart = show.metadata.mainShowStart ? new Date(show.metadata.mainShowStart) : show.metadata.mainShowStart;
    const showEnd = show.metadata.showEnd ? new Date(show.metadata.showEnd) : show.metadata.showEnd;

    const showDate = getClosestWan(new Date(preShowStart));

    const preShowLength = preShowStart && mainShowStart ? getTimeUntil(mainShowStart, preShowStart.getTime()).string : null;
    const mainShowLength = mainShowStart && showEnd ? getTimeUntil(showEnd, mainShowStart.getTime()).string : null;

    const onTimeDistance = mainShowStart ? (showDate.getTime() - mainShowStart.getTime()) : null;
    const onTime = mainShowStart ? getTimeUntil(showDate, mainShowStart.getTime()) : null;
</script>

<div class="card inline-block limit p-3 m-2">
    <h3>{showDate.toLocaleDateString()}</h3>
    <hr>
    <div class="inline-block mr-2">
        <h4>Pre Show</h4>
        {#if preShowStart}
            {preShowStart.toLocaleTimeString(undefined, {timeStyle: "short"})}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
        -
        {#if mainShowStart}
            {mainShowStart.toLocaleTimeString(undefined, {timeStyle: "short"})}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
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
        {#if mainShowStart}
            {mainShowStart.toLocaleTimeString(undefined, {timeStyle: "short"})}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
        -
        {#if showEnd}
            {showEnd.toLocaleTimeString(undefined, {timeStyle: "short"})}
        {:else}
            <span class="opacity-50">
                N/A
            </span>
        {/if}
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
                    {onTime.string} late
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
</div>
<style>
    .red {
        color: red;
    }
    .green {
        color: green;
    }
</style>