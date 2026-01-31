<script lang="ts">
  import { getFieldName } from "$lib/lttstore/field_names.js";
  import DateStamp from "$lib/DateStamp.svelte";
  import ProductInfo from "./ProductInfo.svelte";
  import { getDiffComponent } from "$lib/lttstore/field_components.ts";

  let { data } = $props();
</script>

<div class="table-container rounded-md">
  <table class="table table-hover rounded-md">
    <thead>
    <tr>
      <th>Product</th>
      <th>What changed</th>
      <td>Change seen</td>
      <th>Before</th>
      <th>After</th>
    </tr>
    </thead>
    <tbody>
    {#each data.changeHistory as change, i}
      {@const SvelteComponent = getDiffComponent(change.field)}
      {@const SvelteComponent_1 = getDiffComponent(change.field)}
      <tr>
        <td><ProductInfo productId={change.id} initiallyLoad={i < 5}/></td>
        <td>{getFieldName(change.field)}</td>
        <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
        <td><SvelteComponent before={change.old} after={change.new} displaying="before"/></td>
        <td><SvelteComponent_1 before={change.old} after={change.new} displaying="after"/></td>
      </tr>
    {/each}
    </tbody>
    <tfoot>
    <tr style="text-transform: initial !important;">
      <td class="!p-2 opacity-70" colspan="3">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
    </tr>
    </tfoot>
  </table>
</div>