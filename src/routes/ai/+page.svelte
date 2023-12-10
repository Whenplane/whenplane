<script lang="ts">

  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { capitalize, type HistoricalEntry } from "$lib/utils";
  import sanitizeHtml from 'sanitize-html';
  import LoadingHistoricalShow from "$lib/history/LoadingHistoricalShow.svelte";
  import HistoricalShow from "$lib/history/HistoricalShow.svelte";

  let query = dev ? "How late was last week's show?" : "";
  let lastQuery = undefined;

  let responseText = "";
  let eventSource: EventSource | undefined = undefined;

  const showDatas: {[key: string]: Promise<HistoricalEntry>} = {}

  let mentionedShows = new Set<string>();

  let dots = "";
  let doti = 0;
  const dotOptions = [
    ".",
    "..",
    "...",
    "....",
  ]

  onMount(() => {
    let dotInterval = setInterval(() => {
      dots = dotOptions[doti];
      doti++;
      if(doti >= dotOptions.length) {
        doti = 0;
      }
    }, 500)
    return () => clearInterval(dotInterval);
  })

  function handleInputKeypress(e) {
    if(e.key === 'Enter' || e.keyCode === 13) search();
  }

  const endpoint = dev ? "http://localhost:8787/?q=" : "https://wanshow-ai-search.ajg.workers.dev/?q=";

  function search() {
    if(!query) return;
    lastQuery = query;
    responseText = "";
    mentionedShows = new Set();

    if(eventSource !== undefined) eventSource.close();

    let lastChunk = "";
    let duplicated = false;

    eventSource = new EventSource(endpoint + encodeURIComponent(query));
    eventSource.onmessage = (event) => {
      if(event.data == "[DONE]") {
        // SSE spec says the connection is restarted
        // if we don't explicitly close it
        eventSource.close();
        if(duplicated) responseText = responseText.substring(0, responseText.length-lastChunk.length); // remove the last chunk since it seems to be duplicated for some reason
        checkResponseText();
        return;
      }
      const data = JSON.parse(event.data);
      if(!data.response) return;
      duplicated = lastChunk === data.response;
      lastChunk = data.response;
      responseText += data.response;
      checkResponseText();
    }
    eventSource.onerror = () => {
      responseText += "   Error while reading response";
    }
  }

  function checkResponseText() {
    if(responseText.startsWith(" ")) {
      responseText = responseText.substring(1);
    }
    if(responseText.startsWith("[INST] ")) {
      responseText = capitalize(responseText.substring("[INST] ".length));
    }
    if(responseText.startsWith("According to the information provided, ")) {
      responseText = capitalize(responseText.substring("According to the information provided, ".length));
    }
    if(responseText.startsWith("Based on the information provided, ")) {
      responseText = capitalize(responseText.substring("Based on the information provided, ".length));
    }
    if(responseText.startsWith("According to the information provided in the context, ")) {
      responseText = capitalize(responseText.substring("According to the information provided in the context, ".length));
    }
    if(responseText.startsWith("Based on the information provided in the context, ")) {
      responseText = capitalize(responseText.substring("Based on the information provided in the context, ".length));
    }

    responseText = responseText
      .replaceAll(/whenplane link/gi, "link")
      .replaceAll("\n", "<br>")
      .replace(/<(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*))>/g, "<a href='$1' target='_blank'>$1</a>");


    const showPattern = /([0-9]{4}\/[0-9]{2}\/[0-9]{2})/gm
    let match;
    while((match = showPattern.exec(responseText)) != null) {
      mentionedShows.add(match[0]);
      mentionedShows = mentionedShows;
      if(!Object.keys(showDatas).includes(match[0])) {
        showDatas[match[0]] = fetch("/api/history/show/" + match[0])
          .then(r => r.json());
      }
    }

  }
</script>

<div class="limit mx-auto mt-16">
  <h1 class="text-center">Whenplane AI <span class="chip variant-soft-primary">Experimental</span></h1>
  <input class="input" type="text" placeholder="How late was last week's show?" bind:value={query} on:keyup={handleInputKeypress}>
  <br>
  <br>
  {#if typeof lastQuery != "undefined"}
    {#if !responseText}
      {dots}
    {:else}
      {@html sanitizeHtml(responseText)}
    {/if}
  {/if}
  <br>
  <br>
</div>
<div class="text-center mx-12">
  {#if mentionedShows.size > 0}
    <h2>Mentioned Shows</h2>
    {#each Object.entries(showDatas) as [name, show]}
      {#if mentionedShows.has(name)}
        {#await show}
          <LoadingHistoricalShow/>
        {:then show}
          <HistoricalShow {show} withThumbnail={true}/>
        {:catch err}
        {/await}
      {/if}
    {/each}
  {/if}
</div>