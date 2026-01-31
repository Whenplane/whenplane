<script lang="ts">
  import Record from "$lib/history/Record.svelte";
  import { page } from "$app/state";

  let { data, children } = $props();
</script>

<div class="flex h-screen w-screen">
  <div class="nav static left-0 top-0">
    <a class="anchor pt-2 pl-2" href="/history">Back to history</a>
    <br>
    <a href="/history/graph/lateness" class="hidden-link">
      <Record record={data.records.earliest} early={true} selected={page.url.pathname.endsWith("lateness")}>
        Earliest show
      </Record>
    </a>
    <br>
    <a href="/history/graph/lateness" class="hidden-link">
      <Record record={data.records.mostLate} late={true} selected={page.url.pathname.endsWith("lateness")}>
        Most late show
      </Record>
    </a>
    <br>
    <a href="/history/graph/preShowLength" class="hidden-link">
      <Record record={data.records.longestPreShow} selected={page.url.pathname.endsWith("preShowLength")}>
        Longest pre-show
      </Record>
    </a>
    <br>
    <a href="/history/graph/showLength" class="hidden-link">
      <Record record={data.records.longestShow} selected={page.url.pathname.endsWith("showLength")}>
        Longest main show
      </Record>
    </a>
    <br>
    <a href="/history/graph/preShowLength" class="hidden-link">
      <Record record={data.records.shortestPreShow} selected={page.url.pathname.endsWith("preShowLength")}>
        Shortest pre-show
      </Record>
    </a>
    <br>
    <a href="/history/graph/showLength" class="hidden-link">
      <Record record={data.records.shortestShow} selected={page.url.pathname.endsWith("showLength")}>
        Shortest main show
      </Record>
    </a>
  </div>

  <div class="w-full h-screen overflow-auto p-2">
    {@render children?.()}
  </div>
</div>
<!--<pre>{JSON.stringify(data, undefined, '\t')}</pre>-->

<style>
  .nav {
      @apply inline;
      border-right: solid 1px rgba(255, 255, 255, 0.2);
  }
</style>