<script lang="ts">
  import { run } from 'svelte/legacy';

  import { page } from "$app/state";
  import { resultsPerPage } from "./search.ts";
  import MiniShow from "$lib/history/MiniShow.svelte";
  import sanitizeHtml from "sanitize-html";
  import LinkPaginator from "$lib/util/LinkPaginator.svelte";
  import { browser, dev } from "$app/environment";
  import ToolTip from "$lib/ToolTip.svelte";
  import { setCookie, strip } from "$lib/cookieUtils.ts";
  import LastUpdate from "./indexUpdateStatus/LastUpdate.svelte";
  import { truncateText } from "$lib/utils.ts";

  let sp = $state(page.url.searchParams);

  let q = $state(sp.get("q"));

  let { data } = $props();

  let searchForm: HTMLFormElement = $state();

  let defaultTitle = true;
  let defaultTopics = true;
  let defaultTranscripts = true;
  let defaultMerchMessages = false;

  let searchTitle = $state(defaultTitle);
  let searchTopics = $state(defaultTopics);
  let searchTranscripts = $state(defaultTranscripts);
  let searchMerchMessages = $state(defaultMerchMessages);
  let keyword = $state(false);

  updateDefaults(q);
  function updateDefaults(q: string | null) {
    if(browser && !q) {
      const localTitle = localStorage.getItem("searchTitle");
      if(localTitle != null) {
        defaultTitle = localTitle === "true";
      } else {
        defaultTitle = true;
      }

      const localTopics = localStorage.getItem("searchTopics");
      if(localTopics != null) {
        defaultTopics = localTopics === "true";
      } else {
        defaultTopics = true;
      }

      const localTranscripts = localStorage.getItem("searchTranscripts");
      if(localTranscripts != null) {
        defaultTranscripts = localTranscripts === "true";
      } else {
        defaultTranscripts = true;
      }

      const localMerchMessages = localStorage.getItem("searchMerchMessages");
      if(localMerchMessages != null) {
        defaultMerchMessages = localMerchMessages === "true";
      }

      console.log({localTitle, localTopics, localTranscripts, localMerchMessages})
      searchTitle = defaultTitle;
      searchTopics = defaultTopics;
      searchTranscripts = defaultTranscripts;
      searchMerchMessages = defaultMerchMessages;
    }
  }


  function update(sp: URLSearchParams) {
    searchTitle = (sp.get("title")) === "on";
    searchTopics = (sp.get("topics")) === "on";
    searchTranscripts = (sp.get("transcripts")) === "on";
    searchMerchMessages = (sp.get("merch-messages")) === "on";
    keyword = (sp.get("keyword")) === "on";
  }





  let first = $state(true);

  const description = "Find things that happened during The WAN Show. The WAN Show Search was made to make it much easier to find moments that happened during the WAN show. It includes useful features such as date filtering, multiple sorting options, and filtering based on result type. You can search through Topics/Timestamps (courtesy of Noki aka \"Timestamp Guy\"), transcripts, show titles, and optionally even Merch Messages.";

  run(() => {
    sp = page.url.searchParams
  });
  run(() => {
    q = sp.get("q")
  });
  run(() => {
    updateDefaults(q);
  });
  run(() => {
    if(q) update(sp);
  });
  let searchSort = $derived(sp.get("sort") ?? "default");
  let before = $derived(sp.get("before"));
  let after = $derived(sp.get("after"));
  run(() => {
    console.debug({searchTitle, searchTopics, searchTranscripts, searchMerchMessages})
  });
  let moreOptionsUsed = $derived((!before ? 0 : 1) + (!after ? 0 : 1) + (keyword ? 1 : 0));
  let highlightVisibility = $derived(data.settings?.highlightVisibility === "true");
  run(() => {
    if(!q && browser && !first) {
      localStorage.setItem("searchTitle", searchTitle+"");
      localStorage.setItem("searchTopics", searchTopics+"");
      localStorage.setItem("searchTranscripts", searchTranscripts+"");
      localStorage.setItem("searchMerchMessages", searchMerchMessages+"");
    } else if(!q && browser) first = false;
  });
</script>

<svelte:head>
  {#if q}
    <title>Search for {q} - Whenplane WAN Show Search</title>
    {#if data.result}
      <meta name="description" content="{data.result.found} results found in {data.result.search_time_ms}ms." />
    {/if}
  {:else}
    <title>WAN Show Search - Whenplane</title>
    <meta name="description" content={truncateText(description, 159)}>
    <link rel="canonical" href="https://whenplane.com{$page.url.pathname}"/>
  {/if}
</svelte:head>

{#if !q}
  <span class="clear inline-block absolute pointer-events-none" style="z-index: -5;">
		{description}
	</span>
{/if}

{#if !q}
  <ol class="breadcrumb pt-2 pl-2">
    <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
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
    <input type="search" placeholder="Search" name="q" class="input search-box-top-bar p-2 pl-4" value={q}>
    <div class="inline-block pl-2">
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="title" bind:checked={searchTitle} onchange={() => searchForm.submit()}>
        <span>Titles</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="topics" bind:checked={searchTopics} onchange={() => searchForm.submit()}>
        <span>Topics</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="transcripts" bind:checked={searchTranscripts} onchange={() => searchForm.submit()}>
        <span>Transcripts</span>
      </label>
      <label class="inline-block px-2">
        <input type="checkbox" class="checkbox" name="merch-messages" bind:checked={searchMerchMessages} onchange={() => searchForm.submit()}>
        <span>Merch Messages</span>
      </label>
      <label class="inline-block px-2">
        <span>Sort</span>
        <select class="input w-36" name="sort" bind:value={searchSort} onchange={() => searchForm.submit()}>
          <option value="default" selected>Default (Show Date & Type & Relevance)</option>
          <option value="showDate">Show Date & Relevance (newest first)</option>
          <option value="showDateOldest">Show Date & Relevance (oldest first)</option>
          <option value="type">Type & Relevance</option>
          <option value="relevance">Relevance Only</option>
        </select>
      </label>

      <ToolTip placement="bottom" event="click" id="more-search-params">
        {#snippet icon()}
              
              <span class="btn variant-filled-surface cursor-pointer">
                More
                {#if moreOptionsUsed > 0}
                  <span class="badge-icon variant-filled-warning ml-2">
                    {moreOptionsUsed}
                  </span>
                {/if}
              </span>
          
              {/snippet}
        {#snippet content()}
              
            <label>
              <span>Before</span>
              <input type="date" name="before" class="input" bind:value={before} onchange={() => searchForm.submit()}>
            </label>
            <br>
            <label>
              <span>After</span>
              <input type="date" name="after" class="input" bind:value={after} onchange={() => searchForm.submit()}>
            </label>
            <br>
            <label>
              <input type="checkbox" class="checkbox" name="keyword" bind:checked={keyword} onchange={() => searchForm.submit()}>
              <span>
                Basic Key Word Search
                <ToolTip id="keyword-search-info">
                  By default, Whenplane uses embeddings to search by both meaning and key words.
                  This helps find more results even if you dont remember the exact words used.
                  You can go back to basic keyword search by checking this box.
                </ToolTip>
              </span>
            </label>
          
              {/snippet}
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
          {#snippet icon()}
                  
              <span class="btn variant-filled-surface cursor-pointer">
                Settings
              </span>
            
                  {/snippet}
          {#snippet content()}
                  
              <label>
                <input type="checkbox" class="checkbox" onchange={e => {
                const checked = e.target?.checked;
                setCookie("searchHighlightVisibility", checked);
                highlightVisibility = checked;
              }}>
                <span>Enhanced keyword match visibility</span>
              </label>
            
                  {/snippet}
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
          {@const show = data.shows?.[hit.document.videoId ?? hit.document.showName ?? hit.document.show]}
          {@const cleanedId = hit.document.id.replaceAll("topic-", "")}
          {@const baseShowUrl = "/history/show/" + (show ? show.name : `${hit.document.videoId}` )}
          {@const strippedSnippet = hit.highlight?.text?.snippet?.replaceAll("<mark>", "").replaceAll("</mark>", "")}
          {@const href = (hit.document.type === "message" || hit.document.type === "reply") ? `/history/show/${hit.document.show}/merch-messages#${hit.document.show}-${Math.floor(hit.document.timestamp)}` : baseShowUrl + (hit.document.type.startsWith("transcript") ? "/transcript?find=" + encodeURIComponent(strippedSnippet) + "#match" : "") + (hit.document.type === "topic" ? (show ? "#timestamp-" + cleanedId : `?hash=${encodeURIComponent('#timestamp-' + cleanedId)}` ) : "")}
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
            {#if hit.document.type === "topic" && hit.document.parentText}
                <span class="opacity-60">
                  {hit.document.parentText}
                </span>
            {/if}
            <div class="pl-4 result-highlight opacity-90 max-w-full" class:result-visibility-highlight={highlightVisibility} class:pl-8={hit.document.parentText}>
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
  {#if dev}
    <pre>{JSON.stringify(data, undefined, '\t')}</pre>
  {/if}
  <div class="limit mx-auto p-2 mb-16">
    I hope to make The WAN Show Search as usable as possible, and I need your feedback to do that.
    If you have <b>any</b> suggestions, issues, or feedback, please <a href="/support">let me know</a>!
    <br>
    <br>
    <br>
    <span class="text-sm opacity-60">
        Whenplane and The WAN Show Search on Whenplane is not affiliated with or endorsed by Linus Media Group.
      </span>
  </div>


{:else} <!-------------------------------------------------    no query, show the big search page      ------------------------------------------------->





  <div class="h-almost-full w-full flex items-center justify-center p-2">
    <div class="text-center">
      <enhanced:img src="./wan_show_search.png" class="search-logo mx-auto" alt="The WAN Show Search" title="The WAN Show Search" sizes="min(1330px, 38em)" />
      <br>
      <form method="GET">
        <input type="search" placeholder="Search" name="q" class="input search-box p-2 pl-4" autofocus><br>
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

      <span class="block text-sm opacity-60">
        Whenplane and The WAN Show Search on Whenplane is not affiliated with or endorsed by LMG.
      </span>

      <ToolTip placement="bottom" event="click" id="last-update-info">
        {#snippet icon()}
              
              <span class="btn btn-sm variant-filled-surface cursor-pointer">
                Last Update Info
              </span>
          
              {/snippet}
        {#snippet content()}
              
            <LastUpdate/>
          
              {/snippet}
      </ToolTip>
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