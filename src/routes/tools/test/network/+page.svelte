<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  export let data;
</script>

<button on:click={invalidateAll} class="btn variant-ghost-success">Invalidate</button>

<pre>{JSON.stringify(data, undefined, '\t')}</pre>