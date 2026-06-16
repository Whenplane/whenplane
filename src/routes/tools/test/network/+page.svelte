<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();
</script>

<button onclick={invalidateAll} class="btn preset-tonal-success border border-success-500">Invalidate</button>

<pre>{JSON.stringify(data, undefined, '\t')}</pre>