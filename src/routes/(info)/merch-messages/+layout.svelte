<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

{@render children?.()}
<br>
<div class="p-4">
  <span class="text-sm opacity-60">
    Whenplane and the Whenplane Merch Messages Index is not affiliated with or endorsed by Linus Media Group.
  </span>
</div>