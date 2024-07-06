<script>

  import { browser } from "$app/environment";
  import { onMount } from "svelte";


  let min = browser ? randomString() : "";
  let max = "";

  let repeat = false;


  let string = "...";
  if(browser) newString();

  function randomString() {
    const array = new Uint8Array(17);
    crypto.getRandomValues(array);

    return btoa(array).replaceAll("=", "");
  }

  function newString() {
    string = randomString();
    if(string.length < min.length) {
      min = string;
    }
    if(string.length > max.length) {
      max = string;
    }
  }

  onMount(() => {
    let i = setInterval(() => {
      if(repeat) newString();
    }, 5)
    return () => clearInterval(i);
  })
  $: console.log({ repeat })

</script>

<div class="m-2">
  {#if !repeat}
    <code class="m-2">{string}</code>
  {/if}
  <br>
  {string.length} ({min.length}/{max.length})<br>
  min: <code>{min}</code><br>
  max: <code>{max}</code>
  <br>
  <br>
  <button on:click={newString}>Randomize</button><br>
  <label>
    <input type="checkbox" bind:checked={repeat}>
    Constantly generate new.
  </label>
</div>