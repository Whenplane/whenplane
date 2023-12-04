<script>
  import ClickableImage from "$lib/ClickableImage.svelte";
  import { page } from "$app/stores";
</script>
<svelte:head>
  <title>Whenplane Floatplane Widget Extension</title>
  <meta name="description" content="For you fellow Floatplane watchers, I've made a browser extension that replaces the 'Offline' screen on the LTT floatplane channel with whenplane."/>
  <meta name="og:image" content="/extension/screenshots/late.png">
  <meta name="twitter:card" content="/extension/screenshots/late.png">
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Extension</li>
</ol>

<div class="limit-large mx-auto mt-12 px-4">
  <h1>Whenplane Floatplane Widget Extension</h1>
  For you fellow Floatplane watchers, I've made a browser extension that replaces the "Offline" screen on the LTT floatplane channel with whenplane.
  <br>
  <br>

  <div class="text-center">
    <a
      class="btn variant-filled-primary my-1"
      href="https://addons.mozilla.org/en-US/firefox/addon/whenplane-floatplane-widget/"
      target="_blank"
      rel="noopener"
    >
      <img src="/extension/browser-icons/firefox.svg" class="browser-icon">
      Download for Firefox
    </a>
    <a
      class="btn variant-filled-secondary my-1"
      href="https://chromewebstore.google.com/detail/whenplane-floatplane-widget/jiijhgibeiaaacbohdjihncoingomjjm"
      target="_blank"
      rel="noopener"
    >
      <img src="/extension/browser-icons/chrome.svg" class="browser-icon">
      Download for Chrome
    </a>
    <br>
    <br>
    <br>
    <ClickableImage src="/extension/screenshots/late.png" style="width: 25em;" width="1920" height="994"/>
    <ClickableImage src="/extension/screenshots/after.png" style="width: 25em;" width="1920" height="994"/>
  </div>
</div>

<style>
  .browser-icon {
      height: 2em;
      border-radius: 100%;
      @apply mx-2;
  }
</style>