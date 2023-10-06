<script lang="ts">
  import type { MainLate } from "$lib/utils.ts";
  import { timeString } from "$lib/timeUtils.ts";
  import LatenessVoting from "$lib/LatenessVoting.svelte";

  let lateness = 0;

  let mainLate: MainLate;
  $: mainLate = {
    isMainLate: true,
    late: true,
    distance: lateness,
    string: timeString(lateness)
  }
</script>

<input type="range" class="input" min="0" max={24 * 60 * 60e3} step="1000" bind:value={lateness}>
{mainLate.string}

<LatenessVoting {mainLate}/>