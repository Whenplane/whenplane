<script lang="ts">
  import {enhance} from "$app/forms";

  let { data, form } = $props();
</script>

<div class="mx-auto card login-box p-4">
  <h3>Please enter your two-factor token</h3>
  <br>
  <form method="POST" use:enhance>
    <label class="label">
      <input class="input px-3" name="token" type="text" placeholder="Two-factor token" minlength=""/>
    </label>
    <br>


    {#if form?.missing}
            <span class="text-primary-600-400">
                Please fill in all fields
            </span>
    {/if}
    {#if form?.incorrect}
            <span class="text-primary-600-400">
                Invalid two-factor token. Please try again
            </span>
    {/if}
    {#if form?.message}
            <span class="text-primary-600-400">
                {form.message}
            </span>
    {/if}
    {#if form?.ratelimited}
            <span class="text-primary-600-400">
                You are trying to sign in too fast. Wait a minute and try again.
            </span>
    {/if}


    <br>
    <button class="btn preset-tonal-primary">Sign In</button>
  </form>
</div>

<style>
    .login-box {
        max-width: min(500px, calc(100vw - 1em));
    }
</style>