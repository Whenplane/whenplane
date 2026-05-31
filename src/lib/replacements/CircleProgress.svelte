<script lang="ts">
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  import { typed } from "$lib";

  let {
    value = typed<number | null>(null),
    width = typed<string>("w-fit"),
    class: classes = typed<string>(""),
    size = typed<number>(16),
  } = $props();
</script>

<Progress class="items-center {width} {classes}" {value}>
  <Progress.Circle style="--size: calc(var(--spacing) * {size});;">
    <Progress.CircleTrack />
    <Progress.CircleRange />
  </Progress.Circle>
  <Progress.ValueText />
</Progress>