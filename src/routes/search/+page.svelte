<script lang="ts">
  import { page } from "$app/stores";
  import { resultsPerPage } from "./search.ts";
  import MiniShow from "$lib/history/MiniShow.svelte";
  import sanitizeHtml from "sanitize-html";
  import Paginator from "$lib/util/Paginator.svelte";
  import LinkPaginator from "$lib/util/LinkPaginator.svelte";
  import { browser } from "$app/environment";

  $: q = $page.url.searchParams.get("q")

  export let data;

  let searchTitle = true;
  let searchTopics = true;
  let searchTranscripts = true;
  let searchMerchMessages = false;

  if(browser) {
    const localTitle = localStorage.getItem("searchTitle");
    if(localTitle != null) {
      searchTitle = localTitle === "true";
    }

    const localTopics = localStorage.getItem("searchTopics");
    if(localTopics != null) {
      searchTopics = localTopics === "true";
    }

    const localTranscripts = localStorage.getItem("searchTranscripts");
    if(localTranscripts != null) {
      searchTranscripts = localTranscripts === "true";
    }

    const localMerchMessages = localStorage.getItem("searchMerchMessages");
    if(localMerchMessages != null) {
      searchMerchMessages = localMerchMessages === "true";
    }
  }

  let first = true;
  $: if(browser && !first) {
    localStorage.setItem("searchTitle", searchTitle+"");
    localStorage.setItem("searchTopics", searchTopics+"");
    localStorage.setItem("searchTranscripts", searchTranscripts+"");
    localStorage.setItem("searchMerchMessages", searchMerchMessages+"");
  } else if(browser) first = false;

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
      <img src="/wan_show_search.png" class="search-logo-small inline-block px-2" alt="The WAN Show Search" title="The WAN Show Search" width="1330" height="529">
    </a>
  </div>
  <form method="GET" class="inline-block px-4">
    <input placeholder="Search for topics" name="q" class="input search-box-top-bar p-2 pl-4" value={q}>
    <div class="inline-block px-2">
      Search:
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="title" bind:checked={searchTitle}>
        <span>Show Titles</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="topics" bind:checked={searchTopics}>
        <span>Topics</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="transcripts" bind:checked={searchTranscripts}>
        <span>Transcripts</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="merch-messages" bind:checked={searchMerchMessages}>
        <span>Merch Messages</span>
      </label>
    </div>
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
        {#key q}
          <LinkPaginator currentPage={data.page} totalPages={Math.ceil(data.result.found / resultsPerPage)}/>
        {/key}
      </div>
      {#each data.result.hits as hit}
        {@const show = data.shows?.[hit.document.videoId ?? hit.document.showName]}
        {@const cleanedId = hit.document.id.replaceAll("topic-", "")}
        {@const baseShowUrl = "/history/show/" + (show ? show.name : `${hit.document.videoId}` )}
        {@const href = baseShowUrl + (hit.document.type === "topic" ? (show ? "#timestamp-" + cleanedId : `?hash=${encodeURIComponent('#timestamp-' + cleanedId)}` ) : "")}
        <span class="opacity-70">
          {#if hit.document.type === "topic"}
            Topic
          {:else if hit.document.type === "message" || hit.document.type === "reply"}
            Merch Message
          {:else if hit.document.type === "title"}
            Show Title
          {:else if hit.document.type === "transcript"}
            Transcript
          {:else}
            {hit.document.type}
          {/if}
        </span>
        <a
          class="hidden-link block p-2"
          {href}
          data-sveltekit-reload
        >
          {#if show}
            <MiniShow {show}/>
          {:else}
            <span class="opacity-60">
              Couldn't find this show for some reason. Please report this!
            </span>
          {/if}
          <br>
          <div class="pl-4 result-highlight opacity-80 max-w-full">
            {@html sanitizeHtml(hit.highlight?.text?.snippet ?? hit.document.text, {allowedTags: ["mark"]})}
          </div><br>
        </a><br>
      {:else}
        No results found.
      {/each}
      <div class="text-right">
        {#key q}
          <LinkPaginator currentPage={data.page} totalPages={Math.ceil(data.result.found / resultsPerPage)}/>
        {/key}
      </div>
    {:else}
      No results.
    {/if}
  </div>


{:else}
  <div class="h-almost-full w-full flex items-center justify-center p-2">
    <div class="text-center">
      <img src="/wan_show_search.png" class="search-logo mx-auto" alt="The WAN Show Search" title="The WAN Show Search" width="1330" height="529">
      <br>
      <form method="GET">
        <input placeholder="Search for topics" name="q" class="input search-box p-2 pl-4"><br>
        Search:
        <label class="inline-block px-2">
          <input type="checkbox" class="checkbox" name="title" bind:checked={searchTitle}>
          <span>Show Titles</span>
        </label>
        <label class="inline-block px-2">
          <input type="checkbox" class="checkbox" name="topics" bind:checked={searchTopics}>
          <span>Topics</span>
        </label>
        <label class="inline-block px-2">
          <input type="checkbox" class="checkbox" name="transcripts" bind:checked={searchTranscripts}>
          <span>Transcripts</span>
        </label>
        <label class="inline-block px-2">
          <input type="checkbox" class="checkbox" name="merch-messages" bind:checked={searchMerchMessages}>
          <span>Merch Messages</span>
        </label>

      </form>
      <br>
      <span class="text-sm opacity-60">
        Whenplane and The WAN Show Search on Whenplane is not affiliated with or endorsed by LMG.
      </span>
    </div>
  </div>
{/if}

<style>
  .h-almost-full {
      height: 90vh;
  }
  .search-logo {
      max-height: 15em;
      width: auto;
      @apply p-2;
  }
  .search-logo-small {
      max-height: 5em;
      width: auto;
  }


  .search-box {
      width: min(550px, 90vw);
  }
  .search-box-top-bar {
      width: calc(80vw - 580px);
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