<script>
  import {Turnstile} from "svelte-turnstile";

  export let siteKey;
  export let passed = false;

  function unPass() {
    passed = false;
  }
  function pass() {
    passed = true
  }
</script>

<br>
<div class="turnstile inline-block mx-auto">
  <Turnstile {siteKey} on:turnstile-error={unPass} on:turnstile-expired={unPass} on:turnstile-timeout={unPass} on:turnstile-callback={pass}/>
</div>
<br>

<style>
    div {
        height: 65px;
        width: 300px;
    }
</style>