<script>
  import ClickableImage from "$lib/ClickableImage.svelte";
</script>

<div class="limit-large mx-auto mt-16">
  <h1>Whenplane Floatplane Widget Extension</h1>
  For you fellow Floatplane watchers, I've made a browser extension that replaces the "Offline" screen on the LTT floatplane channel with whenplane.
  <br>
  <br>

  <div class="text-center">
    <a
      class="btn variant-filled-primary"
      href="https://addons.mozilla.org/en-US/firefox/addon/whenplane-floatplane-widget/"
      target="_blank"
      rel="noopener"
    >
      <img src="/extension/browser-icons/firefox.svg" class="browser-icon">
      Download for Firefox
    </a>
    <a
      class="btn variant-filled-secondary"
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
    <ClickableImage src="/extension/screenshots/late.png" style="width: 48%;"/>
    <ClickableImage src="/extension/screenshots/after.png" style="width: 48%;"/>
  </div>
</div>

<style>
  .browser-icon {
      height: 2em;
      border-radius: 100%;
      @apply mx-2;
  }
</style>