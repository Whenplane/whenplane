<script>
    import HistoricalShow from "$lib/HistoricalShow.svelte";
    import OldHistory from "$lib/OldHistory.svelte";
    import { browser, dev } from "$app/environment";
    import HistoryRecords from "$lib/HistoryRecords.svelte";
    import LinusFace from "$lib/LinusFace.svelte";
    import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";
    import { setCookie } from "$lib/cookieUtils";

    import ViewStacked from "svelte-bootstrap-icons/lib/ViewStacked.svelte"
    import CardImage from "svelte-bootstrap-icons/lib/CardImage.svelte"
    import Images from "svelte-bootstrap-icons/lib/Images.svelte"
    import Grid from "svelte-bootstrap-icons/lib/Grid.svelte"

    export let data;

    console.debug({data})

    let view = data.history.viewType ?? 0;

    let first = true;
    $: {
        if(first) {
            first = false;
        } else if(browser) {
            setCookie("historyViewType", view);
        }
    }

</script>
<svelte:head>
    <title>WAN Show History</title>
</svelte:head>
<a href="/" class="pt-2 pl-2">Back to Countdown</a>
<div class="text-center">
    <h1 class="text-center">WAN Show History</h1>

    <HistoryRecords {data}/>

    <br>
    <RadioGroup>
        <RadioItem bind:group={view} name="justify" value={0}><Images/></RadioItem>
        <RadioItem bind:group={view} name="justify" value={1}><CardImage/></RadioItem>
        <RadioItem bind:group={view} name="justify" value={2}><ViewStacked/></RadioItem>
        <RadioItem bind:group={view} name="justify" value={3}><Grid/></RadioItem>
    </RadioGroup>
    <br>

    <div class="inline-block"
         class:thumbnail-inline={view === 0}
         class:thumbnail-list={view === 1}
         class:old-layout={view === 2}
         class:thumbnailless-inline={view === 3}
    >
        {#each data.history.currentYear as show (show.name)}
            <HistoricalShow {show} withThumbnail={view < 2}/>
        {/each}
        <LinusFace/>
        <OldHistory withThumbnail={view < 2}/>
        <br>
        <br>
        <br>
    </div>
</div>
