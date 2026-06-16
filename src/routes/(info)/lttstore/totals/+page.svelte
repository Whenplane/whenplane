<script lang="ts">
  import TotalMoveRateGraph from "./TotalMoveRateGraph.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<TotalMoveRateGraph stockHistory={data.totalsHistory} historyDays={data.historyDays} />