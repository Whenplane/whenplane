<script>

  import { getPreviousWAN, getUTCDate } from "$lib/timeUtils";
  import {DateTime} from "luxon";

  let value = $state(0);

  let testingDate = $derived(DateTime.now().plus({day: value}).toJSDate());
  let computedPrevious = $derived(getPreviousWAN(testingDate));

</script>
<div class="text-center limit mx-auto">
  Previous WAN
  <input type="range" class="input" min="-7" max="7" step="0.25" bind:value>
  {value}<br>
  <br>
  {testingDate.toLocaleString()}'s ({getUTCDate(testingDate)})<br>
  previous is<br>
  {computedPrevious.toLocaleString()} ({getUTCDate(computedPrevious)})
</div>