<script lang="ts">
  import SubscriberGraph from "./SubscriberGraph.svelte";

  let { data } = $props();
</script>

<SubscriberGraph subHistory={data.subHistory}/>

<!--<pre>{JSON.stringify(data, undefined, '\t')}</pre>-->