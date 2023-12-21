<script lang="ts">
  import { capitalize, type SpecialStream } from "$lib/utils.ts";
  import CheckCircle from "svelte-bootstrap-icons/lib/CheckCircle.svelte";
  import XCircle from "svelte-bootstrap-icons/lib/XCircle.svelte";
  import ExclamationCircle from "svelte-bootstrap-icons/lib/ExclamationCircle.svelte";

  export let service: "floatplane" | "twitch" | "youtube";
  export let specialStreamData: SpecialStream;
  $: genericData = specialStreamData as {[key: string]: boolean | string}

  $: isOn = specialStreamData["on" + capitalize(service)] ?? false;
  $: note = specialStreamData[service + "Notes"];
</script>

{#if isOn && !note}
  <span class="green">
    <CheckCircle style="display: inline-block;"/>
  </span>
{:else if isOn && note}
  <span class="yellow">
    <ExclamationCircle style="display: inline-block;"/>
  </span>
  ({note})
{:else}
  <span class="red">
    <XCircle style="display: inline-block;"/>
  </span>
{/if}

<style>
  .red {
      color: red;
  }
  .yellow {
      color: orange;
  }
  .green {
      color: green;
  }
</style>



