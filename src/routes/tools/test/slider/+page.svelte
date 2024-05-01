<script>

    import {getNextWAN} from "$lib/timeUtils";
    import {DateTime} from "luxon";

    const next = getNextWAN(undefined, false);

    let value = 0;
    let hasDone = false;

    $: computedNext = getNextWAN(DateTime.fromJSDate(next).plus({day: value}).toJSDate(), true, hasDone);

</script>
<div class="text-center limit mx-auto">
    Next WAN
    <input type="range" class="input" min="-7" max="7" step="0.25" bind:value>
    {value}<br>
    <label>
        <input type="checkbox" class="" bind:checked={hasDone}>
        <span>hasDone</span>
    </label>
    {hasDone}<br>
    <br>
    {computedNext.toLocaleString()}
</div>