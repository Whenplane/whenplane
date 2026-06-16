<script module>
  import { writable } from "svelte/store";
  import { browser, dev } from "$app/environment";
  import { random } from "$lib/utils";

  let initiallyDismissed = false;
  if(browser) {
    const setting = localStorage.getItem("permanentSearchAdDismiss");

    if(setting == null) {
      initiallyDismissed = dev ? false : random(0, 5, true) !== 0;
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

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  })
</script>
{#if !$dismissed && mounted}
  <div class="card p-3 m-2 relative z-30" out:fade={{duration: 200}} in:fade={{duration: 1500, delay: 2e3}}>
    <h1>WAN Show Search</h1>
    Have you ever needed to find when something happened in the wan show?<br>
    You can use The WAN Show Search on Whenplane to help make that process much easier!<br>
    <a href="/search">Get started</a>

    <button class="inline-block absolute top-2 right-3 opacity-70 x" onclick={() => dismissed.set(true)}>
      <span class="just-x"><X/></span>
      <span class="x-circle"><XCircleFill/></span>
    </button>

    <button class="inline-block absolute bottom-2 right-3 permanent-dismiss opacity-50" onclick={() => {dismissed.set(true);localStorage.setItem("permanentSearchAdDismiss", "true")}}>
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