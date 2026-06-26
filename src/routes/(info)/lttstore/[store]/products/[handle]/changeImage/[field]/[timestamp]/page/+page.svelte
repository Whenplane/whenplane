<script lang="ts">
  import { getFieldName } from "$lib/lttstore/field_names";
  import { getDiffComponent } from "$lib/lttstore/field_components";

  let { data } = $props();

  const SvelteComponent = $derived(getDiffComponent(data.change.field));
</script>

<div class="table-container rounded-md bg-surface-900" id="change">
  <table class="table rounded-md w-fit max-w-screen">
    <thead>
    <tr>
      <th>What changed</th>
      <th class="max-w-[46%]">Before</th>
      <th class="max-w-[46%]">After</th>
    </tr>
    </thead>
    <tbody>
    <tr class="align-top">
      <td>{getFieldName(data.change.field)}</td>
      <td>
        <SvelteComponent before={data.change.old} after={data.change.new} displaying="before"/>
      </td>
      <td>
        <SvelteComponent before={data.change.old} after={data.change.new} displaying="after"/>
      </td>
    </tr>
    </tbody>
  </table>
</div>

<style>
  #change {
      width: fit-content;
  }
</style>
