<script>

  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import sanitizeHtml from 'sanitize-html';

  let query = dev ? "How late was last week's show?" : "";
  let lastQuery = undefined;

  let fetching;

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

  function search() {
    if(!query) return;
    lastQuery = query;
    fetching = fetch("https://wanshow-ai-search.ajg.workers.dev/?q=" + encodeURIComponent(query)).then(r => r.json())
  }
</script>

<div class="limit mx-auto mt-16">
  <h1 class="text-center">Whenplane AI <span class="chip variant-soft-primary">Experimental</span></h1>
  <input class="input" type="text" placeholder="How late was last week's show?" bind:value={query} on:keyup={handleInputKeypress}>
  <br>
  <br>
  {#if fetching}
    {#await fetching}
      <span class="opacity-75">{dots}</span>
    {:then response}
      {@html sanitizeHtml(
        response.answer
          .replaceAll("\n", "<br>\n")
          .replace(/<(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*))>/g, "<a href='$1' target='_blank'>$1</a>")
      )}
    {/await}
  {/if}
</div>