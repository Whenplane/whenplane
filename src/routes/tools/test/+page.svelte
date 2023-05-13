<script>
    import {getClosestWan, getNextWAN, getPreviousWAN} from "$lib/timeUtils";

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
</div>
