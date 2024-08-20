<script>
import { page } from "$app/stores";
</script>

<svelte:head>
  <meta name="robots" content="noindex">
  <title>Whenplane Fetcher Bot Info</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Fetcher Info</li>
</ol>


<div class="limit mx-auto pt-8">
  <h1>Whenplane Fetcher</h1>
  If you have this page, you were probably linked to it from the Whenplane Fetcher or Taskrunner bots.<br>
  <br>
  Whenplane fetches content from external services (e.g. Floatplane, Youtube, Twitch) in order to display up-to-date information on this site (Whenplane).<br>
  Whenever fetches this content, where possible, it will attach a User-Agent header to the request pointing back to Whenplane.<br>
  <br>
  If Whenplane is sending an unusual or unnecessary number of requests, <b>please</b> feel free
  to reach out at <a class="whitespace-nowrap" href="mailto:fetcher-inquiry@whenplane.com">fetcher-inquiry@whenplane.com</a>
</div>