<script lang="ts">
    import TimeInput from "$lib/TimeInput.svelte";
    import {getPreviousWAN, addZero} from "$lib/timeUtils";

    const previousWAN = getPreviousWAN();

    let date = previousWAN.getFullYear() + "-" + addZero(previousWAN.getMonth() + 1) + "-" + addZero(previousWAN.getDate());
    $: dateDate = new Date(date);

    let timeStamp = 0;
    let timeAtTimeStamp = "16:25";
    let startsAt: Date | undefined;
    $: {
        startsAt = new Date(date + " " + timeAtTimeStamp);
        startsAt.setSeconds(startsAt.getSeconds() - timeStamp);
    }

    let showStartTimestamp = 5 * 60;
    let preEndsAt: Date | undefined;
    $: {
        if(startsAt) {
            preEndsAt = new Date(startsAt);
            preEndsAt.setSeconds(preEndsAt.getSeconds() + showStartTimestamp);
        }
    }

    let totalLength = (4 * 60 * 60) + (5 * 60);
    let endsAt: Date | undefined;
    $: {
        if(startsAt) {
            endsAt = new Date(startsAt);
            endsAt.setSeconds(endsAt.getSeconds() + totalLength);
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
    Which means that the pre-show starts at {startsAt?.toLocaleTimeString()}
    <br>
    <br>
    The <b>main show starts</b> (and preshow ends) at timestamp <TimeInput bind:value={showStartTimestamp}/><br>
    Which means that the main show starts at {preEndsAt?.toLocaleTimeString()}
    <br>
    <br>
    The <b>total VOD length</b> (FP, including pre-show) is <TimeInput bind:value={totalLength}/><br>
    Which means the show ended at {endsAt?.toLocaleTimeString()}
    <br>
    <br>
    <div class="card text-left mx-auto">
        <pre>
            &#123;
                name: "{dateDate.getUTCFullYear()}/{dateDate.getUTCMonth() + 1}/{dateDate.getUTCDate()}",
                metadata: &#123;
                    preShowStart: "{startsAt?.toISOString()}",
                    mainShowStart: "{preEndsAt?.toISOString()}",
                    showEnd: "{endsAt?.toISOString()}"
                &#125;
            &#125;
        </pre>
    </div>
</div>