<script lang="ts">
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from "svelte";

  let {
    checked = $bindable(),
    children,
    disabled = false
  }: {
    checked: boolean;
    children: Snippet;
    disabled: boolean
  } = $props();

</script>

<Switch {checked} onCheckedChange={(details) => (checked = details.checked)} {disabled}>
  <Switch.Control>
    <Switch.Thumb />
  </Switch.Control>
  <Switch.Label>
    {@render children?.()}
  </Switch.Label>
  <Switch.HiddenInput />
</Switch>