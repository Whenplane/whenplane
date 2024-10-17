<script lang="ts">
  import { enhance } from '$app/forms';
  import Turnstile from "$lib/Turnstile.svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { fade } from 'svelte/transition';
  export let form;

  let firstPassword: string;
  let secondPassword: string;

  let turnstileCompleted = false;
  let turnstileCounter = 0;

  let loading = false;
</script>
<div class="text-center">
  <h1>Register</h1>
  <br>
  <div class="mx-auto card login-box p-4">
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
        <input class="input px-3" name="email" type="email" value={form?.email ?? ''} required/>
      </label>
      <br>
      <label class="label">
        <span>Username</span>
        <input class="input px-3" name="username" type="text" value={form?.username ?? ''} required minlength="3" maxlength="16" pattern="^[\w-]+$"/>
      </label>
      <br>
      <label class="label">
        <span>Password</span>
        <input class="input px-3" name="firstPassword" type="password" bind:value={firstPassword} required minlength="10"/>
      </label>
      <label class="label">
        <span>Repeat Password</span>
        <input class="input px-3" name="secondPassword" type="password" bind:value={secondPassword} required minlength="10"/>
      </label>
      <br>
      {#key turnstileCounter}
        <Turnstile siteKey="0x4AAAAAAAxkT_jDLpLOTZfP" bind:passed={turnstileCompleted}/>
      {/key}
      <br>

      {#if form?.passwordsDontMatch || firstPassword !== secondPassword}
        <span class="text-primary-500-400-token">
          Please make sure that both password fields match.
        </span>
        <br>
      {/if}
      {#if form?.missing}
        <span class="text-primary-500-400-token">
          Please fill in all fields
        </span>
        <br>
      {/if}
      {#if form?.usernameLength}
        <span class="text-primary-500-400-token">
          Please make sure that your username is between 3 and 16 characters long.
        </span>
        <br>
      {/if}
      {#if form?.passwordLength}
        <span class="text-primary-500-400-token">
          Please make sure that your password is <i>at least</i> 10 characters long.
        </span>
        <br>
      {/if}
      {#if form?.invalidEmail}
        <span class="text-primary-500-400-token">
          Please enter a valid email address.
        </span>
        <br>
      {/if}
      {#if form?.restrictedEmail}
        <span class="text-primary-500-400-token">
          <b>This email address is restricted!</b><br>
          If this really is your address, please reach out to
          <a href="mailto:support@whenplane.com">support@whenplane.com</a>, or use another email address.<br>
          This restriction is to prevent spam.
        </span>
        <br>
      {/if}
      {#if form?.message}
        <span class="text-primary-500-400-token">
          {form.message}
        </span>
      {/if}
      {#if form?.ratelimited}
        <span class="text-primary-500-400-token">
          You are trying to register too fast. Wait a minute and try again.
        </span>
      {/if}

      {#if form?.existingEmail || form?.existingUsername}
        <span class="text-primary-500-400-token">
          There is already an account registered for that {form?.existingEmail ? "email address" : "username"}! If you forgot your password,
          please <a href="/auth/login/forgot-password">reset it</a>.
        </span>
        <br>
      {/if}


      <br>
      <button class="btn variant-glass-primary" disabled={firstPassword !== secondPassword || !turnstileCompleted}>Register</button>
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