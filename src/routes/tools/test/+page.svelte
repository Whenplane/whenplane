<script>
    import {getClosestWan, getNextWAN, getPreviousWAN} from "$lib/timeUtils";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
</script>
<div class="limit mx-auto">
    <br>

    Next: {getNextWAN()}
    <br>
    Previous: {getPreviousWAN()}
    <br>
    <br>

    Closest to now: {getClosestWan()}
    <br>
    Closest to tomorrow: {getClosestWan(tomorrow)}
    <br>
    Closest to yesterday: {getClosestWan(tomorrow)}
</div>
