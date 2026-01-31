<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();
</script>

<button onclick={invalidateAll} class="btn variant-ghost-success">Invalidate</button>

<pre>{JSON.stringify(data, undefined, '\t')}</pre>