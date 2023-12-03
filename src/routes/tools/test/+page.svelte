<script>
    import {getClosestWan, getNextWAN, getPreviousWAN} from "$lib/timeUtils";
    import BlurHash from "$lib/history/BlurHash.svelte";
    import LargerLazyLoad from "$lib/LargerLazyLoad.svelte";
    import LatenessVotingTest from "./LatenessVotingTest.svelte";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

</script>
<div class="limit mx-auto">
    <br>
    Now: {new Date()}
    <br>
    <br>

    Next: {getNextWAN()}
    <br>
    Previous: {getPreviousWAN()}
    <br>
    <br>

    <table>
        <tr>
            <td>Closest to yesterday: </td>
            <td>{getClosestWan(yesterday)}</td>
        </tr>
        <tr>
            <td>Closest to now:</td>
            <td>{getClosestWan()}</td>
        </tr>
        <tr>
            <td>Closest to tomorrow:</td>
            <td>{getClosestWan(tomorrow)}</td>
        </tr>
    </table>

    <br>
    <br>
    <LatenessVotingTest/>
    <div style="height: 100vh;"></div>
    more<br>
    more<br>
    more<br>
    more<br>
    more<br>
    this is before
    <LargerLazyLoad>
        <BlurHash blurhash={{hash: "UCC?Q2_456RiyDNGVsn,whVsNtXSTJXSxHnj", w: 320, h: 200}}/>
    </LargerLazyLoad>
    this is after
    <div style="height: 100vh;"></div>
</div>
