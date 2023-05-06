<script>
    import {onMount} from "svelte";
    import {getNextWAN, getTimeUntil} from "./timeUtils";

    let nextWan = getNextWAN();

    export let isLate = false;
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
            isLate = false;
            countdownText = getTimeUntil(started).string;
        } else {
            const timeUntil = getTimeUntil(nextWan);
            countdownText = timeUntil.string
            isLate = timeUntil.late;
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