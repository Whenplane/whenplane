<script lang="ts">
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  import { typed } from "$lib";

  let {
    value = typed<number | null>(null),
    width = typed<string>("w-fit"),
    class: classes = typed<string>("")
  } = $props();
</script>

<Progress class="items-center {width} {classes}" {value}>
  <Progress.Circle>
    <Progress.CircleTrack />
    <Progress.CircleRange />
  </Progress.Circle>
  <Progress.ValueText />
</Progress>