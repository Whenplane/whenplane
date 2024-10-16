<script lang="ts">
  import { enhance } from '$app/forms';
  import {page} from "$app/stores";
  import Turnstile from "$lib/Turnstile.svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { fade } from 'svelte/transition';

  export let form;

  let turnstileCompleted = false;

  let loading = false;
  let turnstileCounter = 0;
</script>
<div class="text-center">
  <h1>Log in</h1>
  <br>
  {#if $page.url.searchParams.has("reauth")}
    <span class="text-primary-500-400-token">
        Please log in again
    </span>
    <br>
    <br>
  {/if}
  {#if $page.url.searchParams.has("email-verified")}
    <span class="text-success-500-400-token">
        Thank you for verifying your email! You can now log in.
    </span>
    <br>
    <br>
  {/if}
  <div class="mx-auto card login-box p-4">
    <form method="POST" action="?/login" use:enhance={() => {
        loading = true
        return async ({ update }) => {
          turnstileCompleted = false;
          turnstileCounter++;

          await update({ reset: false });
          loading = false
        };
      }}>
      <label class="label">
        <span>Username</span>
        <input class="input px-3" name="username" type="text" value={form?.username ?? $page.url.searchParams.get("username") ?? ''} required/>
      </label>
      <br>
      <label class="label">
        <span>Password</span>
        <input class="input px-3" name="password" type="password" required/>
      </label>
      <br>
      {#key turnstileCounter}
        <Turnstile siteKey="0x4AAAAAAAxkT_jDLpLOTZfP" bind:passed={turnstileCompleted}/>
      {/key}
      <br>


      {#if form?.missing}
            <span class="text-primary-500-400-token">
                Please fill in all fields
            </span>
        <br>
      {/if}
      {#if form?.incorrect}
            <span class="text-primary-500-400-token">
                Incorrect username or password
            </span>
        <br>
      {/if}
      {#if form?.message}
            <span class="text-primary-500-400-token">
                {form.message}
            </span>
        <br>
      {/if}
      {#if form?.ratelimited}
            <span class="text-primary-500-400-token">
                You are trying to log in too fast. Wait a minute and try again.
            </span>
        <br>
      {/if}
      {#if form?.emailVerificationNeeded}
            <span class="text-primary-500-400-token">
                You must verify your email before you can log in.<br>
              {#if form?.resendToken}
                <button
                  class="btn variant-glass-primary btn-sm"
                  formnovalidate
                  formaction="?/resendVerification&resendToken={encodeURIComponent(form.resendToken)}"
                >
                  Re-send verification email
                </button>
              {:else}
                <!-- If theres not a resend token, that means that a previous email is still valid -->
                Check your email.
              {/if}
            </span>
        <br>
      {/if}
      {#if form?.emailResent}
        <span class="text-success-500-400-token">
          A new verification email has been sent. Don't forget to check your spam folder if you don't see it in your main inbox!
        </span>
      {/if}


      <br>
      <button class="btn variant-glass-primary">Log In</button>
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