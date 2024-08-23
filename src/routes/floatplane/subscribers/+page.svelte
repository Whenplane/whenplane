<script lang="ts">
  import SubscriberGraph from "./SubscriberGraph.svelte";

  export let data;
</script>

<SubscriberGraph subHistory={data.subHistory}/>

<pre>{JSON.stringify(data, undefined, '\t')}</pre>