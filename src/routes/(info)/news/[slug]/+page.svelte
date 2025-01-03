<script>
  import { page } from "$app/stores";
  import sanitizeHtml from "sanitize-html";
  import { newsSanitizeSettings } from "$lib/news/news";
  import { truncateText } from "$lib/utils";
  import { getTimePreference } from "$lib/prefUtils";

  export let data;

  const postDate = new Date(data.post.timestamp);
</script>

<svelte:head>
  <title>{data.post.title} - Whenplane News</title>
  <meta name="description" content={truncateText(sanitizeHtml(data.post.body, {allowedTags: []}), 200)}>
  <meta name="created" content="{postDate.toISOString()}">
  <meta name="date" content="{postDate.toISOString()}">
  <meta name="available" content="{postDate.toISOString()}">
  <meta name="author" content="ajgeiss0702">
  <meta name="creator" content="ajgeiss0702">
  <meta name="publisher" content="Whenplane">
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/news">News</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{data.post.title}</li>
</ol>

<div class="limit mx-auto pb-32 px-2">
  <h1>{data.post.title}</h1>
  <div class="date text-right opacity-70">
    {postDate.toLocaleDateString(undefined, {dateStyle: "long"})}
    at
    {postDate.toLocaleTimeString(undefined, {timeStyle: "short", hour12: getTimePreference()})}
  </div>
  <hr>
  {@html sanitizeHtml(data.post.body, newsSanitizeSettings)}
</div>

<style>
  .date {
      font-size: 0.9em;
      line-height: 0.5em;
      position: relative;
      bottom: 0.25rem;
  }
</style>