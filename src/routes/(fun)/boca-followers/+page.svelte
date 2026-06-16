<script lang="ts">

  import FollowerGraph from "./FollowerGraph.svelte";

  let { data } = $props();

</script>

<FollowerGraph followerHistory={data.followHistory}/>

<!--<pre>{JSON.stringify(data, undefined, '\t')}</pre>-->