<script context="module" lang="ts">
    import {writable} from "svelte/store";
    import type { MainLate } from "$lib/utils.ts";

    export const mainLate = writable<MainLate>({isMainLate: false});

</script>

<script>
    import {onMount} from "svelte";
    import {getClosestWan, getNextWAN, getTimeUntil} from "./timeUtils";
    import {page} from "$app/stores";

    let nextWan = getNextWAN(undefined, undefined, $page.data.hasDone);

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
                nextWan = getNextWAN(undefined, undefined, $page.data.hasDone);
            }
            const timeUntil = getTimeUntil(nextWan);
            countdownText = timeUntil.string
            isAfterStartTime = timeUntil.late;
            if(timeUntil.late) {
                mainLate.set({
                    isMainLate: true,
                      ...(timeUntil)
                });
            }
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