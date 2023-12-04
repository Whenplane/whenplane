<script>
  export let src;
  export let margin = "m-2";
</script>
<a href={src} class={margin} target="_blank" rel="noopener">
  <img {src} {...$$restProps}>
</a>

<style>
  img {
      display: inline-block;
      border: rgba(255, 255, 255, 0.5) solid 2px;
      border-radius: 8px;
  }
</style>