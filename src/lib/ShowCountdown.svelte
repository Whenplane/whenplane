<script>
    import {onMount} from "svelte";
    import {getNextWAN, getTimeUntil} from "./timeUtils";

    let nextWan = getNextWAN();

    export let isLate = false;

    let countdownText = "";

    onMount(() => {
        let updateInterval = setInterval(updateCountdown, 1e3);

        return () => clearInterval(updateInterval);
    })
    updateCountdown();

    function updateCountdown() {
        const timeUntil = getTimeUntil(nextWan);
        countdownText = timeUntil.string
        isLate = timeUntil.late;
    }
</script>
{countdownText}