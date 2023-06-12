<script lang="ts">
    import TimeInput from "$lib/TimeInput.svelte";
    import {getPreviousWAN, addZero} from "$lib/timeUtils";
    import {DateTime} from "luxon";

    const previousWAN: DateTime = getPreviousWAN(undefined, true);
    const previousWANUTC = previousWAN.toUTC();

    let date = previousWANUTC.year + "-" + addZero(previousWANUTC.month) + "-" + addZero(previousWANUTC.day);
    $: dateDate = DateTime.fromISO(date);
    $: jsDateDate = dateDate.toJSDate();


    let timeStamp = 0;
    let timeAtTimeStamp = "16:25";
    let startsAt: DateTime | undefined;
    $: {
        startsAt = DateTime.fromISO(date + "T" + timeAtTimeStamp)
        startsAt.minus({seconds: timeStamp})
        console.log({startsAt})
    }

    let showStartTimestamp = 5 * 60;
    let preEndsAt: DateTime | undefined;
    $: {
        if(startsAt) {
            preEndsAt = startsAt.plus({seconds: showStartTimestamp})
        }
    }

    let totalLength = (4 * 60 * 60) + (5 * 60);
    let endsAt: DateTime | undefined;
    $: {
        if(startsAt) {
            endsAt = startsAt.plus({seconds: totalLength})
        }
    }
</script>

<div class="text-center limit mx-auto">
    <h1 class="my-3">Timestamp tool</h1>
    This page is meant to help finding the timestamps for start/end times.
    <br>
    <br>
    <input type="date" class="input w-48" bind:value={date}><br>
    {date}
    <br>
    <br>
    At timestamp <TimeInput bind:value={timeStamp}/>, the time is
    <input class="input inline-block text-left w-44" type="time" step="1" bind:value={timeAtTimeStamp}/><br>
    Which means that the pre-show starts at {startsAt?.toLocaleString({timeStyle: "medium"})}
    <br>
    <br>
    The <b>main show starts</b> (and preshow ends) at timestamp <TimeInput bind:value={showStartTimestamp}/><br>
    Which means that the main show starts at {preEndsAt?.toLocaleString({timeStyle: "medium"})}
    <br>
    <br>
    The <b>total VOD length</b> (FP, including pre-show) is <TimeInput bind:value={totalLength}/><br>
    Which means the show ended at {endsAt?.toLocaleString({timeStyle: "medium"})}
    <br>
    <br>
    <div class="card text-left mx-auto">
        <pre>
            &#123;
                name: "{jsDateDate.getUTCFullYear()}/{jsDateDate.getUTCMonth() + 1}/{jsDateDate.getUTCDate()}",
                metadata: &#123;
                    preShowStart: "{startsAt?.toUTC().toISO()}",
                    mainShowStart: "{preEndsAt?.toUTC().toISO()}",
                    showEnd: "{endsAt?.toUTC().toISO()}"
                &#125;
            &#125;
        </pre>
    </div>
</div>