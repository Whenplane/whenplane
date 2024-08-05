<script lang="ts">
  import { onMount } from "svelte";
  import {timeStringHours, timeString} from "$lib/timeUtils";

  const startTime = 1722647765000;
  const totalTime = (150 * 60 * 60e3);

  let string: string | undefined = "";
  let distance: number;

  function update() {
    distance = Date.now() - startTime;
    string = timeStringHours(distance);
  }

  update();

  onMount(() => {
    let i = setInterval(update, 1e3);
    return () => clearInterval(i);
  })
</script>

<div class="limit mx-auto pt-8">
  <h1>{string}</h1>
  into the subathon.
  <br>
  <br>

  <a href="https://twitch.tv/bocabola_">twitch.tv/bocabola_</a>

  <br>
  <br>
  The subathon is currently {((distance / totalTime) * 100).toFixed(3)}% complete.
  <br>
  <br>
  There is
  <span class="font-mono">
    {timeString(totalTime - distance, true)}
  </span>
  remaining.

</div>