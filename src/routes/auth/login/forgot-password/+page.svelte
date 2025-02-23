<script>
  import {enhance} from "$app/forms";
  import { fade } from "svelte/transition";
  import Turnstile from "$lib/Turnstile.svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import {page} from "$app/stores";
  import { dev } from "$app/environment";

  export let form;

  let email = form?.email ?? "";

  let turnstileCompleted = false;
  let turnstileCounter = 0;

  let loading = false;

</script>

<div class="text-center">
  <h1>Password Reset</h1>
  {#if $page.url.searchParams.has("expiredToken")}
    <span class="text-primary-500-400-token">
        That password reset link expired. Please request a new one below.
    </span>
    <br>
    <br>
  {/if}
  {#if form?.success}
    <div class="text-green-400">
      <h2>Success!</h2>
      If an account exists with the email you specified, we sent a password reset confirmation to it.<br>
      Check your email for further instructions.
    </div>
    If you need more help recovering your account, feel free to <a href="/support">contact support</a>.
    <br>
    <br>
  {/if}
  <div class="mx-auto card login-box p-4">
    Forgot your password? or just want to change it?<br>
    You're in the right place!<br>
    <br>
    Enter the email associated with your account, and we will send a password reset request to it.<br>
    <br>
    <form method="POST" use:enhance={() => {
        loading = true
        return async ({ update }) => {
          turnstileCompleted = false;
          turnstileCounter++;

          await update({ reset: false });
          loading = false
        };
      }}>

      <label class="label">
        <span>Email</span>
        <input class="input px-3" name="email" type="email" placeholder="user@example.com" required bind:value={email}/>
      </label>

      {#key turnstileCounter}
        <Turnstile siteKey="0x4AAAAAAAxkT_jDLpLOTZfP" bind:passed={turnstileCompleted}/>
      {/key}

      {#if form?.invalidEmail}
        <span class="text-primary-500-400-token">
          Please enter a valid email address.
        </span>
        <br>
      {/if}

      {#if form?.ratelimited}
        <span class="text-primary-500-400-token">
          You are sending password reset requests too quickly. Wait a minute and try again.
        </span>
      {/if}


      <br>
      <button class="btn variant-glass-primary" disabled={!turnstileCompleted || !email}>Reset Password</button>
      {#if loading}
        <li class="crumb" transition:fade|global={{duration: 100}}>
          <ProgressRadial width="w-6" stroke={250} value={loading ? undefined : 100}/>
        </li>
      {/if}
    </form>
  </div>
</div>

<style>
    .login-box {
        max-width: min(500px, calc(100vw - 1em));
    }
</style>