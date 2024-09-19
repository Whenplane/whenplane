<script lang="ts">

  import FollowerGraph from "./FollowerGraph.svelte";

  export let data;

</script>

<FollowerGraph followerHistory={data.followHistory}/>

<!--<pre>{JSON.stringify(data, undefined, '\t')}</pre>-->