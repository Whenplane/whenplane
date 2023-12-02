<script>
  import { onMount } from "svelte";
  import {popup} from "@skeletonlabs/skeleton";

  let timeString = "";

  onMount(() => {
    let interval = setInterval(updateTimeString, 5e3);
    return () => clearInterval(interval);
  })

  function updateTimeString() {
    timeString = new Date().toLocaleTimeString(undefined, { timeZone: "America/Vancouver", timeStyle: "short" })
  }
  updateTimeString();
</script>
<div
  class="ltttime"
  use:popup={{
    event: 'hover',
    target: 'ltttime-info',
    placement: 'top'
  }}
>
  <span>
    LTT Time
  </span>
  <br>
  {timeString}
</div>
<div data-popup="ltttime-info">
  <div class="card p-3 py-2 whitespace-nowrap shadow-x1 z-15 font-normal text-right">
    The current time in LTT land<br>
    (Vancouver)
  </div>
</div>
<style>
  .ltttime {
      border-bottom: rgba(255, 255, 255, 0.2) solid 1px;
      border-left: rgba(255, 255, 255, 0.2) solid 1px;
      border-bottom-left-radius: 0.5rem;

      font-size: 0.9rem;
      line-height: 0.85rem;
      text-align: center;
      padding: 0.2rem;
  }
  span {
      font-size: 0.75rem;
      line-height: 0.5rem;
  }
</style>