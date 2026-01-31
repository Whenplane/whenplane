<script lang="ts">
  import LazyLoad from "@dimfeld/svelte-lazyload";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();


  interface Props {
    shown?: boolean;
    before?: boolean;
    after?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    shown = $bindable(false),
    before = false,
    after = true,
    children
  }: Props = $props();
</script>
{#if shown && before}
  {@render children?.()}
{/if}
<div class="relative no-pointer-events width-1">
  <div class="absolute">
    <div class="relative bottom width-1">
      <LazyLoad on:visible={() => {shown = true; dispatch("visible")}} height="50em"/>
    </div>
  </div>
</div>
{#if shown && after}
  {@render children?.()}
{/if}
<style>
  .bottom {
      bottom: 25em;
  }
  .width-1 {
      width: 1rem;
  }
</style>