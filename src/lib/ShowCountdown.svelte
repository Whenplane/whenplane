<script context="module" lang="ts">
    import {writable} from "svelte/store";

    export const mainLate = writable({isMainLate: false});

</script>

<script>
    import {onMount} from "svelte";
    import {getClosestWan, getNextWAN, getTimeUntil} from "./timeUtils";

    let nextWan = getNextWAN();

    let showPlayed = false;

    export let isAfterStartTime = false;
    export let data;

    let countdownText = "";

    onMount(() => {
        let updateInterval = setInterval(updateCountdown, 1e3);

        return () => clearInterval(updateInterval);
    })
    updateCountdown();

    function updateCountdown() {
        if(data.isMainShow || data.isPreShow) {
            console.log({data})
            if(!data.isMainShow && data.isPreShow) {
                const mainScheduledStart = getClosestWan()
                mainScheduledStart.setMinutes(mainScheduledStart.getMinutes() + 30);

                mainLate.set({
                    isMainLate: true,
                    ...getTimeUntil(mainScheduledStart)
                })
            } else {
                mainLate.set({isMainLate: false});
            }
            const started = new Date(data.mainShowStarted ?? data.preShowStarted);
            isAfterStartTime = true;
            showPlayed = true;
            countdownText = getTimeUntil(started).string;
        } else {
            if(showPlayed) {
                showPlayed = false;
                nextWan = getNextWAN();
            }
            const timeUntil = getTimeUntil(nextWan);
            countdownText = timeUntil.string
            isAfterStartTime = timeUntil.late;
            mainLate.set({isMainLate: false});
        }
    }
</script>
<span>
    {countdownText}
</span>

<style>
    span {
        font-family: monospace;
    }
</style>