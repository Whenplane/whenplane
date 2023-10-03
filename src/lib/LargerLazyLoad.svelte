<script>
  import LazyLoad from "@dimfeld/svelte-lazyload";

  export let shown = false;

  export let before = false;
  export let after = true;
</script>
{#if shown && before}
  <slot/>
{/if}
<div class="relative no-pointer-events width-1">
  <div class="absolute">
    <div class="relative bottom width-1">
      <LazyLoad on:visible={() => {shown = true; console.log("loaded")}} height="50em"/>
    </div>
  </div>
</div>
{#if shown && after}
  <slot/>
{/if}
<style>
  .bottom {
      bottom: 25em;
  }
  .width-1 {
      width: 1rem;
  }
</style>