<script>
  import ToolTip from "$lib/ToolTip.svelte";
  import CheckCircleFill from "svelte-bootstrap-icons/lib/CheckCircleFill.svelte";
</script>

<ToolTip placement="bottom" event="hover" id="up-to-date-info-{Math.round(Math.random()*1e10)}">
  <svelte:fragment slot="icon">
    <span class="text-green-500">
      <CheckCircleFill class="inline-block align-sub"/>
    </span>
  </svelte:fragment>
  <svelte:fragment slot="content">
    The latest index aligns with the latest show! All data available is searchable.
  </svelte:fragment>
</ToolTip>