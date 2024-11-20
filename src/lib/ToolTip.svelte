<script lang="ts">

  import {popup} from "@skeletonlabs/skeleton";
  import type { Placement } from "@floating-ui/dom";
  import Info from "$lib/svg/Info.svelte";

  export let id = "default";
  export let placement: Placement = 'top';
  export let popupClasses = "";
  export let event: "hover" | "click" | "hover-click" | "focus" | "focus-click" = "hover";

  if(id == "default") {
    console.warn("Missing id on tooltip!");
  }

</script>
<div
  use:popup={{
      event,
      target: id,
      placement: placement,
    }}
  class="inline-block [&>*]:pointer-events-none"
  class:cursor-pointer={event !== "hover"}
>
  <slot name="icon">
    <Info classes="!inline-block"/>
  </slot>
</div>

<div class={"card p-4 shadow-x1 z-10 font-normal inline-block " + popupClasses} data-popup={id}>
  <slot/>
  <slot name="content"/>
</div>

<style>
  .card {
      max-width: 60vw;
  }
</style>

