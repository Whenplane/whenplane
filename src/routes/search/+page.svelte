<script lang="ts">
  import { page } from "$app/stores";
  import { resultsPerPage } from "./search.ts";
  import MiniShow from "$lib/history/MiniShow.svelte";
  import sanitizeHtml from "sanitize-html";
  import Paginator from "$lib/util/Paginator.svelte";
  import LinkPaginator from "$lib/util/LinkPaginator.svelte";

  $: q = $page.url.searchParams.get("q")

  export let data;

</script>

<svelte:head>
  {#if q}
    <title>Search for {q} - Whenplane WAN Show Search</title>
    {#if data.result}
      <meta name="description" content="{data.result.found} results found in {data.result.search_time_ms}ms." />
    {/if}
  {:else}
    <title>Whenplane WAN Show Search</title>
    <meta name="description" content="Currently you can only search for topics, but I hope to add more in the future!">
  {/if}
</svelte:head>

{#if !q}
  <ol class="breadcrumb pt-2 pl-2">
    <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    {#if q}
      <li class="crumb"><a class="anchor hover-underline" href="/search">Search</a></li>
      <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
      <li class="crumb">{q}</li>
    {:else}
      <li class="crumb">Search</li>
    {/if}
  </ol>
{/if}


{#if q}

  <div class="inline-block logo-container">
    <a href="/search" class="inline-block p-2 logo-link">
      <img src="/wan_show_search.png" class="search-logo-small inline-block px-2" alt="The WAN Show Search" title="The WAN Show Search">
    </a>
  </div>
  <form method="GET" class="inline-block px-4">
    <input placeholder="Search for topics" name="q" class="input search-box-top-bar p-2 pl-4" value={q}>
  </form>
  <br>
  {#if data.result?.found}
    <div class="limit mx-auto p-2 text-sm opacity-70">
      {data.result.found} results found in {data.result.search_time_ms}ms.
    </div>
  {/if}
  <br>
  <div class="limit mx-auto p-2 mb-32">
    {#if data.result && data.result.hits}
      <div class="text-right">
        <LinkPaginator currentPage={data.page} totalPages={Math.ceil(data.result.found / resultsPerPage)}/>
      </div>
      {#each data.result.hits as hit}
        {@const show = data.shows?.[hit.document.videoId]}
        <a class="hidden-link block p-2" href="/history/show/{hit.document.videoId}?hash={encodeURIComponent('#timestamp-' + hit.document.id)}">
          <span class="result-title result-highlight fake-link">
            {@html sanitizeHtml(hit.highlight?.name?.snippet ?? hit.document.name, {allowedTags: ["mark"]})}
          </span><br>
          {#if show}
            <MiniShow {show}/>
          {:else}
            <span class="opacity-60">
              Couldn't find this show for some reason. Please report this!
            </span>
          {/if}
        </a><br>
      {/each}
      <div class="text-right">
        <LinkPaginator currentPage={data.page} totalPages={Math.ceil(data.result.found / resultsPerPage)}/>
      </div>
    {:else}
      No results.
    {/if}
  </div>


{:else}
  <div class="h-almost-full w-full flex items-center justify-center">
    <div class="text-center">
      <img src="/wan_show_search.png" class="search-logo mx-auto" alt="The WAN Show Search" title="The WAN Show Search">
      <br>
      <form method="GET">
        <input placeholder="Search for topics" name="q" class="input search-box p-2 pl-4">
      </form>
      <br>
      Currently you can only search for topics, but I hope to add more in the future!
    </div>
  </div>
{/if}

<style>
  .h-almost-full {
      height: 90vh;
  }
  .search-logo {
      height: 15em;
  }
  .search-logo-small {
      height: 5em;
  }


  .search-box {
      width: 30vw;
  }
  .search-box-top-bar {
      width: 60vw;
  }
  @media (max-width: 800px) {
      .search-box-top-bar {
          width: 90vw;
      }
      .logo-container {
          @apply block text-center;
      }
  }

  .result-title {
      font-size: 1.5em;
      /*font-weight: bold;*/
  }

  .result-highlight > :global(mark) {
      /*background-color: rgb(var(--color-primary-500) / 0.4);*/
      background-color: inherit;
      color: inherit;
      font-weight: bold;
  }
</style>