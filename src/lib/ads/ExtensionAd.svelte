<script context="module">
  import { writable } from "svelte/store";
  import { browser } from "$app/environment";
  import { random } from "$lib/utils";

  let initiallyDismissed = false;
  if(browser) {
    const setting = localStorage.getItem("permanentExtensionDismiss");

    if(setting == null) {
      initiallyDismissed = random(0, 5, true) !== 0;
    } else {
      initiallyDismissed = setting === "true";
    }
  }

  let dismissed = writable(initiallyDismissed);
</script>
<script>
  import {fade} from "svelte/transition";
  import XCircleFill from "svelte-bootstrap-icons/lib/XCircleFill.svelte";
  import X from "svelte-bootstrap-icons/lib/X.svelte";
  import { onMount } from "svelte";

  let mounted = false;
  onMount(() => {
    mounted = true;
  })
</script>
{#if !$dismissed && mounted}
  <div class="card p-3 m-2 relative z-30" out:fade={{duration: 200}} in:fade={{duration: 1500, delay: 2e3}}>
    <h1>Browser Extension</h1>
    Hello fellow floaters! (and twitch too I guess)<br>
    I've made a browser extension that replaces the Floatplane/Twitch offline page with this site.<br>
    <a href="/extension">More info and download link</a>

    <button class="inline-block absolute top-2 right-3 opacity-70 x" on:click={() => dismissed.set(true)}>
      <span class="just-x"><X/></span>
      <span class="x-circle"><XCircleFill/></span>
    </button>

    <button class="inline-block absolute bottom-2 right-3 permanent-dismiss opacity-50" on:click={() => {dismissed.set(true);localStorage.setItem("permanentExtensionDismiss", "true")}}>
      Don't show again
    </button>
  </div>
{/if}

<style>
  h1 {
      font-size: 2em !important;
  }
  div {
      width: 30em;
  }

  .permanent-dismiss {
      font-size: 0.5em;
  }
  .permanent-dismiss:hover {
      text-decoration: underline;
  }

  .x > .x-circle {
    display: none;
  }

  .x:hover > .just-x {
      display: none;
  }
  .x:hover > .x-circle {
      display: initial;
  }


  /* Hide on mobile since im too lazy to figure out a good way to fit it into the rest of the page without getting in the way */
  @media (max-width: 1400px) {
      div {
          display: none;
      }
  }
</style>