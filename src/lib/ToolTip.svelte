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
<div
  use:popup={{
      event: 'hover',
      target: id,
      placement: placement,
    }}
  class="inline-block [&>*]:pointer-events-none"
>
  <slot name="icon">
    <Info classes="!inline-block"/>
  </slot>
</div>

<div class="card p-4 shadow-x1 z-10 font-normal inline-block" data-popup={id}>
  <slot/>
  <slot name="content"/>
</div>

<style>
  .card {
      max-width: 60vw;
  }
</style>

