<script lang="ts">

  import {popup} from "@skeletonlabs/skeleton";
  import type { Placement } from "@floating-ui/dom";
  import Info from "$lib/svg/Info.svelte";

  interface Props {
    id?: string;
    placement?: Placement;
    popupClasses?: string;
    event?: "hover" | "click" | "hover-click" | "focus" | "focus-click";
    icon?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    content?: import('svelte').Snippet;
  }

  let {
    id = "default",
    placement = 'top',
    popupClasses = "",
    event = "hover",
    icon,
    children,
    content
  }: Props = $props();

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
  {#if icon}{@render icon()}{:else}
    <Info classes="!inline-block"/>
  {/if}
</div>

<div class={"card p-4 shadow-x1 z-10 font-normal inline-block " + popupClasses} data-popup={id}>
  {@render children?.()}
  {@render content?.()}
</div>

<style>
  .card {
      max-width: 60vw;
  }
</style>

