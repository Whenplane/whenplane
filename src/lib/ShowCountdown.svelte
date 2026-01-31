<script module lang="ts">
    import {writable} from "svelte/store";
    import type { MainLate } from "$lib/utils.ts";

    export const mainLate = writable<MainLate>({isMainLate: false});

</script>

<script lang="ts">
    import {onMount} from "svelte";
    import {getClosestWan, getNextWAN, getTimeUntil} from "./timeUtils";
    import {page} from "$app/state";

    let nextWan = getNextWAN(undefined, undefined, page.data.alternateStartTimes, page.data.hasDone);

    let showPlayed = false;

    interface Props {
        isAfterStartTime?: boolean;
        data: any;
    }

    let { isAfterStartTime = $bindable(false), data }: Props = $props();

    let countdownText = $state("");

    onMount(() => {
        let updateInterval = setInterval(updateCountdown, 1e3);

        return () => clearInterval(updateInterval);
    })
    updateCountdown();

    function updateCountdown() {
        if(data.isMainShow || data.isPreShow) {
            if(!data.isMainShow && data.isPreShow && data.liveStatus.twitch.isLive) {
                const mainScheduledStart = getClosestWan(undefined, page.data.alternateStartTimes)

                mainLate.set({
                    isMainLate: true,
                    ...getTimeUntil(mainScheduledStart)
                })
            } else {
                mainLate.set({isMainLate: false});
            }
            const started = new Date(data.mainShowStarted ?? data.preShowStarted ?? data.liveStatus.floatplane.started);
            isAfterStartTime = true;
            showPlayed = true;
            countdownText = getTimeUntil(started).string;
        } else {
            if(showPlayed) {
                showPlayed = false;
                nextWan = getNextWAN(undefined, undefined, page.data.alternateStartTimes, page.data.hasDone);
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