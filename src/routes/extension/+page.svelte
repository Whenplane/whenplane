<script>
  import ClickableImage from "$lib/ClickableImage.svelte";
  import Code from "svelte-bootstrap-icons/lib/CodeSlash.svelte";
  import { page } from "$app/stores";
</script>
<svelte:head>
  <title>Whenplane Widget Extension</title>
  <meta name="description" content="For you fellow Floatplane watchers, (and I guess Twitch too) I've made a browser extension that replaces the "Offline" screen on the LTT Floatplane/Twitch channel with Whenplane."/>
  <meta name="og:image" content="/extension/screenshots/late.png">
  <meta name="twitter:card" content="summary_large_image">
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Extension</li>
</ol>

<div class="limit-large mx-auto mt-12 px-4">
  <h1>Whenplane Widget Extension</h1>
  For you fellow Floatplane watchers, (and I guess Twitch too) I've made a browser extension that replaces the "Offline" screen on the LTT Floatplane/Twitch channel with Whenplane.<br>
  It only replaces the offline screen, so it goes away as soon as they go live.
  <br>
  <br>

  <div class="text-center">
    <a
      class="btn variant-filled-primary my-1"
      href="https://addons.mozilla.org/en-US/firefox/addon/whenplane-widget/"
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
    or <a href="https://downloads.whenplane.com/whenplane_floatplane_widget-1.1.0.zip" download>download zip</a>
    <br>
    <br>
    <a
      class="btn variant-filled-surface my-1"
      href="https://github.com/ajgeiss0702/whenplane-fp-extension"
      target="_blank"
      rel="noopener"
      >
      <Code height="1.5em" width="1.5em" class="mr-2"/>
      Source Code
    </a>
    <br>
    <br>
    <br>
    <ClickableImage src="/extension/screenshots/late.png" style="width: 25em;" width="1920" height="994"/>
    <ClickableImage src="/extension/screenshots/late-filled.png" style="width: 25em;" width="1920" height="994"/>

    <ClickableImage src="/extension/screenshots/after.png" style="width: 25em;" width="1920" height="994"/>
    <ClickableImage src="/extension/screenshots/filled.png" style="width: 25em;" width="1920" height="994"/>

    <ClickableImage src="/extension/screenshots/twitch-filled.png" style="width: 25em;" width="1920" height="994"/>
    <br>
    <br>
    <div class="text-center">
      <h2>Endorsements</h2>
      <div class="inline-block">
        <img src="/extension/endorsements/tibbyjab.png" alt="tibbyjab: Oh wow this whenplane extension is AMAZING haha tysm to the developer"/>
        <img src="/extension/endorsements/StupidServerDude.png" alt="StupidServerDude: this whenplane extension is pretty cool lol"/>
        <img src="/extension/endorsements/Smore.png" alt="Smore: whenplane extension is great lol"/>
      </div>
    </div>
  </div>
</div>

<style>
  .browser-icon {
      width: 2em;
      height: 2em;
      border-radius: 100%;
      @apply mx-2;
  }

  .limit-large {
      margin-bottom: 20em;
  }
</style>