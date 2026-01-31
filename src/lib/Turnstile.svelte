<script lang="ts">
  import {Turnstile} from "svelte-turnstile";

  interface Props {
    siteKey: any;
    passed?: boolean;
  }

  let { siteKey, passed = $bindable(false) }: Props = $props();

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