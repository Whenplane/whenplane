<script lang="ts">

  import {popup} from "@skeletonlabs/skeleton";
  import type { Placement } from "@floating-ui/dom";
  import Info from "$lib/svg/Info.svelte";

  export let id = "default";
  export const placement: Placement = 'top';

  if(id == "default") {
    console.warn("Missing id on tooltip!");
  }

</script>
<slot name="icon">
  <span
    use:popup={{
      event: 'hover',
      target: id,
      placement: placement
    }}
  >
    <Info classes="!inline-block"/>
  </span>
</slot>

<div class="card p-4 shadow-x1 z-10 font-normal inline-block" data-popup={id}>
  <slot/>
</div>

<style>
  .card {
      max-width: 60vw;
  }
</style>

