<script lang="ts">
    import TimeInput from "$lib/TimeInput.svelte";
    import {getPreviousWAN, addZero} from "$lib/timeUtils";
    import {DateTime} from "luxon";
    import {getClosestWan} from "../../../lib/timeUtils";

    const previousWAN: DateTime = getPreviousWAN(undefined, true);
    const previousWANUTC = previousWAN.toUTC();

    let date = previousWANUTC.year + "-" + addZero(previousWANUTC.month) + "-" + addZero(previousWANUTC.day);
    $: dateDate = DateTime.fromJSDate(getClosestWan(new Date(date)));
    $: jsDateDate = dateDate.toJSDate();


    let timeStamp = 0;
    let timeAtTimeStamp = "16:25";
    let startsAt: DateTime | undefined;
    $: {
        let dateParts = date.split("-");
        let timeParts = timeAtTimeStamp.split(":");
        startsAt = DateTime.fromObject({
            year: dateDate.year,
            month: dateDate.month,
            day: dateDate.day,
            hour: Number(timeParts[0]),
            minute: Number(timeParts[1]),
            second: Number(timeParts[2]) || 0
        }, {
            zone: "America/Vancouver"
        })
        startsAt = startsAt.minus({seconds: timeStamp})
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
    WAN of {dateDate.toLocaleString()}
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
                name: "{dateDate.year}/{dateDate.month}/{dateDate.day}",
                metadata: &#123;
                    preShowStart: "{startsAt?.toUTC().toISO()}",
                    mainShowStart: "{preEndsAt?.toUTC().toISO()}",
                    showEnd: "{endsAt?.toUTC().toISO()}"
                &#125;
            &#125;
        </pre>
    </div>
</div>