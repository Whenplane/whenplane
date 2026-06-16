<script>
  import { run } from 'svelte/legacy';


  import { browser } from "$app/environment";
  import { onMount } from "svelte";


  let min = $state(browser ? randomString() : "");
  let max = $state("");

  let repeat = $state(false);


  let string = $state("...");
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
  run(() => {
    console.log({ repeat })
  });

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
  <button onclick={newString}>Randomize</button><br>
  <label>
    <input type="checkbox" bind:checked={repeat}>
    Constantly generate new.
  </label>
</div>