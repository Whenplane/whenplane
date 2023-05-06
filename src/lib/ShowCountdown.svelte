<script>
    import {onMount} from "svelte";
    import {getNextWAN, getTimeUntil} from "./timeUtils";

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