<script lang="ts">
  import { getDiffComponent, getFieldName } from "$lib/lttstore/field_names.js";
  import DateStamp from "$lib/DateStamp.svelte";
  import ProductInfo from "./ProductInfo.svelte";

  export let data;
  console.log("hello! (page)")
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
      <span class="hidden">
        {console.log("change", change?.id, change?.timestamp, change?.field)}
      </span>
      <tr>
        <td><ProductInfo productId={change.id} initiallyLoad={i < 5}/></td>
        <td>{getFieldName(change.field)}</td>
        <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
        <td><svelte:component this={getDiffComponent(change.field)} before={change.old} after={change.new} displaying="before"/></td>
        <td><svelte:component this={getDiffComponent(change.field)} before={change.old} after={change.new} displaying="after"/></td>
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