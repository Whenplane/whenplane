<script lang="ts">
  import { page } from "$app/stores";
  import { resultsPerPage } from "./search.ts";
  import MiniShow from "$lib/history/MiniShow.svelte";
  import sanitizeHtml from "sanitize-html";
  import Paginator from "$lib/util/Paginator.svelte";
  import LinkPaginator from "$lib/util/LinkPaginator.svelte";
  import { browser } from "$app/environment";
  import ToolTip from "$lib/ToolTip.svelte";
  import { setCookie, strip } from "$lib/cookieUtils.ts";

  let q = $page.url.searchParams.get("q");
  $: q = $page.url.searchParams.get("q")

  export let data;

  let searchForm: HTMLFormElement;

  let searchTitle = ($page.url.searchParams.get("title")) === "on";
  let searchTopics = ($page.url.searchParams.get("topics")) === "on";
  let searchTranscripts = ($page.url.searchParams.get("transcripts")) === "on";
  let searchMerchMessages = ($page.url.searchParams.get("merch-messages")) === "on";

  let searchSort = $page.url.searchParams.get("sort") ?? "default";
  let before = $page.url.searchParams.get("before");
  let after = $page.url.searchParams.get("after");
  console.debug({before, after})

  let moreOptionsUsed = (!before ? 0 : 1) + (!after ? 0 : 1);

  let highlightVisibility = data.settings?.highlightVisibility === "true";

  if(browser && !q) {
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
  $: if(!q && browser && !first) {
    localStorage.setItem("searchTitle", searchTitle+"");
    localStorage.setItem("searchTopics", searchTopics+"");
    localStorage.setItem("searchTranscripts", searchTranscripts+"");
    localStorage.setItem("searchMerchMessages", searchMerchMessages+"");
  } else if(!q && browser) first = false;

</script>

<svelte:head>
  {#if q}
    <title>Search for {q} - Whenplane WAN Show Search</title>
    {#if data.result}
      <meta name="description" content="{data.result.found} results found in {data.result.search_time_ms}ms." />
    {/if}
  {:else}
    <title>WAN Show Search - Whenplane</title>
    <meta name="description" content="Find things that happened during The WAN Show">
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
      <li class="crumb">WAN Show Search</li>
    {/if}
  </ol>
{/if}


{#if q}

  <div class="inline-block logo-container">
    <a href="/search" class="inline-block p-2 logo-link">
      <enhanced:img src="./wan_show_search.png" class="search-logo-small inline-block px-2" alt="The WAN Show Search" title="The WAN Show Search" sizes="min(1330px, 13em)" />
    </a>
  </div>
  <form method="GET" class="inline-block pl-4 text-center" bind:this={searchForm}>
    <input placeholder="Search" name="q" class="input search-box-top-bar p-2 pl-4" value={q}>
    <div class="inline-block pl-2">
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="title" bind:checked={searchTitle} on:change={() => searchForm.submit()}>
        <span>Titles</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="topics" bind:checked={searchTopics} on:change={() => searchForm.submit()}>
        <span>Topics</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="transcripts" bind:checked={searchTranscripts} on:change={() => searchForm.submit()}>
        <span>Transcripts</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="merch-messages" bind:checked={searchMerchMessages} on:change={() => searchForm.submit()}>
        <span>Merch Messages</span>
      </label>
      <label class="inline-block px-2">
        <span>Sort</span>
        <select class="input w-36" name="sort" bind:value={searchSort} on:change={() => searchForm.submit()}>
          <option value="default" selected>Default (Show Date & Type & Relevance)</option>
          <option value="showDate">Show Date & Relevance</option>
          <option value="type">Type & Relevance</option>
          <option value="relevance">Relevance Only</option>
        </select>
      </label>

      <ToolTip placement="bottom" event="click" id="more-search-params">
        <svelte:fragment slot="icon">
            <span class="btn variant-filled-surface cursor-pointer">
              More
              {#if moreOptionsUsed > 0}
                <span class="badge-icon variant-filled-warning ml-2">
                  {moreOptionsUsed}
                </span>
              {/if}
            </span>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <label>
            <span>Before</span>
            <input type="date" name="before" class="input" bind:value={before} on:change={() => searchForm.submit()}>
          </label>
          <br>
          <label>
            <span>After</span>
            <input type="date" name="after" class="input" bind:value={after} on:change={() => searchForm.submit()}>
          </label>
        </svelte:fragment>
      </ToolTip>

    </div>
  </form>
  <br>
  {#if data.result?.found}
    <div class="limit mx-auto p-2 text-sm">
      <span class="opacity-70">
        {data.result.found} results found in {data.result.search_time_ms}ms.
      </span>
      <span class="float-right">
        <ToolTip placement="bottom" event="click" id="search-settings">
          <svelte:fragment slot="icon">
            <span class="btn variant-filled-surface cursor-pointer">
              Settings
            </span>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <label>
              <input type="checkbox" class="checkbox" on:change={e => {
                const checked = e.target?.checked;
                setCookie("searchHighlightVisibility", checked);
                highlightVisibility = checked;
              }}>
              <span>Enhanced keyword match visibility</span>
            </label>
          </svelte:fragment>
        </ToolTip>
      </span>
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
      {#key data.result.hits}
        {#each data.result.hits as hit}
          {@const show = data.shows?.[hit.document.videoId ?? hit.document.showName]}
          {@const cleanedId = hit.document.id.replaceAll("topic-", "")}
          {@const baseShowUrl = "/history/show/" + (show ? show.name : `${hit.document.videoId}` )}
          {@const strippedSnippet = hit.highlight?.text?.snippet?.replaceAll("<mark>", "").replaceAll("</mark>", "")}
          {@const href = (hit.document.type === "message" || hit.document.type === "reply") ? `merch-messages/${hit.document.videoId}#${hit.document.videoId}.${hit.document.imageIndex}` : baseShowUrl + (hit.document.type.startsWith("transcript") ? "/transcript?find=" + encodeURIComponent(strippedSnippet) + "#match" : "") + (hit.document.type === "topic" ? (show ? "#timestamp-" + cleanedId : `?hash=${encodeURIComponent('#timestamp-' + cleanedId)}` ) : "")}
          <span class="opacity-70">
            {#if hit.document.type === "topic"}
              Topic
            {:else if hit.document.type === "message" || hit.document.type === "reply"}
              Merch Message
            {:else if hit.document.type === "title"}
              Show Title
            {:else if hit.document.type.startsWith("transcript")}
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
            <div class="pl-4 result-highlight opacity-80 max-w-full" class:result-visibility-highlight={highlightVisibility}>
              {@html sanitizeHtml(hit.highlight?.text?.snippet ?? hit.document.text ?? hit.highlight?.name?.snippet ?? hit.document.name, {allowedTags: ["mark"]})}
            </div><br>
          </a><br>
        {:else}
          No results found.
        {/each}
      {/key}
      <div class="text-right">
        {#key q}
          <LinkPaginator currentPage={data.page} totalPages={Math.ceil(data.result.found / resultsPerPage)}/>
        {/key}
      </div>
    {:else}
      No results.
    {/if}
  </div>
  <div class="limit mx-auto p-2 mb-16">
    The WAN Show Search is still new.
    If you have <b>any</b> suggestions, issues, or feedback, please <a href="/support">let me know</a>!
    I hope to make The WAN Show Search as usable as possible, and I need your feedback to do that.
    <br>
    <br>
    <br>
    <span class="text-sm opacity-60">
        Whenplane and The WAN Show Search on Whenplane is not affiliated with or endorsed by Linus Media Group.
      </span>
  </div>


{:else}
  <div class="h-almost-full w-full flex items-center justify-center p-2">
    <div class="text-center">
      <enhanced:img src="./wan_show_search.png" class="search-logo mx-auto" alt="The WAN Show Search" title="The WAN Show Search" sizes="min(1330px, 38em)" />
      <br>
      <form method="GET">
        <input placeholder="Search" name="q" class="input search-box p-2 pl-4" autofocus><br>
        <div class="py-4">
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
      width: calc(95vw - 800px - 13em);
  }
  @media (max-width: 1400px) {
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
      @apply brightness-200;
  }
  .result-highlight.result-visibility-highlight > :global(mark) {
      color: rgb(var(--color-primary-500))
  }
</style>