<script lang="ts">
  interface Props {
    src: any;
    margin?: string;
    [key: string]: any
  }

  let { src, margin = "m-1", ...rest }: Props = $props();
</script>
<a href={src} class={margin} target="_blank" rel="noopener">
  <img {src} {...rest}>
</a>

<style>
  img {
      display: inline-block;
      border: rgba(255, 255, 255, 0.5) solid 2px;
      border-radius: 8px;
      margin-top: 0.5rem;
  }
</style>