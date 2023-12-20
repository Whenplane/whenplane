<script>
  import { page } from "$app/stores";
  import sanitizeHtml from "sanitize-html";
  import { onMount } from "svelte";
  import { newsSanitizeSettings } from "$lib/news/news.js";
  import { truncateText } from "$lib/utils";

  let title = "";
  $: url = truncateText(title.replace(/[^A-Za-z0-9- ]+/g, "").replace(/\s\s+/g, ' ').replaceAll(" ", "-").toLowerCase(), 50, false)
  let content;
  let timestamp;

  let timestampCopied;
  let timestampCopying = false;

  function updateTimestamp() {
    if(timestampCopied || timestampCopying) return; // Don't change timestamp while the "copied!" text is there
    timestamp = new Date().toISOString();
  }
  updateTimestamp();

  onMount(() => {

    let interval = setInterval(updateTimestamp, 93);

    return () => clearInterval(interval);
  })


  function copyTimestamp() {
    if(timestampCopied || timestampCopying) return;
    timestampCopying = true;
    navigator.clipboard.writeText(timestamp)
      .then(() => {
        timestampCopied = true;
        timestampCopying = false;
        setTimeout(() => timestampCopied = false, 2e3);
      })

  }
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/news">News</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Maker</li>
</ol>
<br>


<div class="text-center">
  <input type="text" bind:value={title} placeholder="Title">
  <br>
  <button class="timestamp" class:copied={timestampCopied} on:click={copyTimestamp}>
    {timestamp}
  </button>
</div>
<br>

<div class="wrapper">
  <textarea bind:value={content} placeholder="Content goes here"></textarea>
  <div class="preview">
    <h2>{title}&ZeroWidthSpace;</h2>
    &ZeroWidthSpace;
    {@html sanitizeHtml(content, newsSanitizeSettings)}
  </div>
</div>
<br>

&ZeroWidthSpace;{url}
<br>


<style>
    textarea, input {
        background-color: rgba(0, 0, 0, 0.1);
    }
    textarea {
        width: 40vw;
        display: inline-block;
        height: 85vh;
        position: relative;
        bottom: 0.25rem;
        font-family: monospace;
    }
    .wrapper {
        text-align: center;
        padding: 0.5rem;
        display: flex;
        vertical-align: middle;
        @apply mx-auto justify-center items-center;
    }
    .preview {
        /*border-radius: 12px;*/
        border: 1px solid rgba(255, 255, 255, 0.5);
        display: inline-block;
        width: 40vw;
        height: 85vh;

        text-align: left;
        padding: 0.25em;

        position: relative;
        bottom: 0.25em;
        margin-left: 0.25rem;

        overflow-y: auto;
        padding-bottom: 5em;
    }

    .copied {
        color: rgb(50, 255, 50);
    }
    .copied::after {
        content: " Copied!";
    }

    .timestamp {
        font-family: monospace;
        font-size: 1.1em;
    }
</style>