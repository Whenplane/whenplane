<script lang="ts">
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from "svelte";

  let {
    checked = $bindable(),
    children,
    disabled = false,
    onCheckedChange
  }: {
    checked: boolean;
    children: Snippet;
    disabled: boolean;
    onCheckedChange: (checked: boolean) => void | undefined;
  } = $props();

</script>

<Switch {checked} onCheckedChange={(details) => {
  checked = details.checked;
  if(onCheckedChange) onCheckedChange(details.checked);
}} {disabled}>
  <Switch.Control>
    <Switch.Thumb />
  </Switch.Control>
  <Switch.Label>
    {@render children?.()}
  </Switch.Label>
  <Switch.HiddenInput />
</Switch>