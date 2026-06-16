<script>
import ToolTip from "$lib/ToolTip.svelte";
import ExclamationTriangleFill from "svelte-bootstrap-icons/lib/ExclamationTriangleFill.svelte";
</script>

<ToolTip placement="bottom" event="hover" id="outdated-notice-{Math.round(Math.random()*1e10)}">
  {#snippet icon()}
  
      <span class="text-orange-600">
        <ExclamationTriangleFill class="inline-block align-sub"/>
      </span>
    
  {/snippet}
  {#snippet content()}
  
      This part of the index is out of date. Some parts of the search index will take 24-48 hours to be indexed.
    
  {/snippet}
</ToolTip>