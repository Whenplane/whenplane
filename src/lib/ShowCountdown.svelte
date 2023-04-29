<script>
    import {onMount} from "svelte";
    import {getNextWAN, getTimeUntil} from "./timeUtils";

    let nextWan = getNextWAN();

    let countdownText = "";

    onMount(() => {
        let updateInterval = setInterval(updateCountdown, 1e3);

        return () => clearInterval(updateInterval);
    })
    updateCountdown();

    function updateCountdown() {
        countdownText = getTimeUntil(nextWan)
    }
</script>
{countdownText}