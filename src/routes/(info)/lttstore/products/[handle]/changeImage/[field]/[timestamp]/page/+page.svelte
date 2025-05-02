<script>
  import { getFieldName } from "$lib/lttstore/field_names";
  import { getDiffComponent } from "$lib/lttstore/field_components";

  export let data;
</script>

<div class="table-container rounded-md" id="change">
  <table class="table table-hover rounded-md">
    <thead>
    <tr>
      <th>What changed</th>
      <th>Before</th>
      <th>After</th>
    </tr>
    </thead>
    <tbody>
    <tr id="change">
      <td>{getFieldName(data.change.field)}</td>
      <td><svelte:component this={getDiffComponent(data.change.field)} before={data.change.old} after={data.change.new} displaying="before"/></td>
      <td><svelte:component this={getDiffComponent(data.change.field)} before={data.change.old} after={data.change.new} displaying="after"/></td>
    </tr>
    </tbody>
  </table>
</div>

<style>
  #change {
      width: fit-content;
      max-width: 90vw;
  }
</style>
