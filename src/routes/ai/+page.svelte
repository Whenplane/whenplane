<script lang="ts">

  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { capitalize } from "$lib/utils";
  import sanitizeHtml from 'sanitize-html';

  let query = dev ? "How late was last week's show?" : "";
  let lastQuery = undefined;

  let responseText = "";
  let eventSource: EventSource | undefined = undefined;

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

    if(eventSource !== undefined) eventSource.close();

    let lastChunk = "";
    let duplicated = false;

    eventSource = new EventSource(endpoint + encodeURIComponent(query));
    eventSource.onmessage = (event) => {
      if(event.data == "[DONE]") {
        // SSE spec says the connection is restarted
        // if we don't explicitly close it
        console.debug("Closing EventSource");
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
</div>