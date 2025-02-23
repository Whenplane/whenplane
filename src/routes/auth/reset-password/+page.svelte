<script lang="ts">
  import { enhance } from '$app/forms';
  import Turnstile from "$lib/Turnstile.svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { fade } from 'svelte/transition';
  import { onMount } from "svelte";
  import {page} from "$app/stores";
  import { goto } from "$app/navigation";

  export let form;

  let firstPassword: string;
  let secondPassword: string;

  let turnstileCompleted = false;
  let turnstileCounter = 0;

  let loading = false;

  let timeTilExpiration = 0;

  onMount(() => {
    if($page.url.searchParams.has("expiration")){
      const expiration = Number($page.url.searchParams.get("expiration"));
      let i = setInterval(() => {
        timeTilExpiration = expiration - Date.now();
        if(timeTilExpiration <= 0) {
          goto("/auth/login/forgot-password?expiredToken")
        }
      }, 1e3);
      return () => clearInterval(i);
    }
  })
</script>
<div class="text-center">
  <h1>Password Reset</h1>
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
      {#if timeTilExpiration > 0 && timeTilExpiration < 61e3}
        <span class="text-primary-500-400-token">
          Hurry up! This password reset token expires in {Math.floor(timeTilExpiration/1e3)} seconds!
        </span>
        <br>
      {:else}
        <br>
      {/if}
      <label class="label">
        <span>New Password</span>
        <input class="input px-3" name="firstPassword" type="password" bind:value={firstPassword} required minlength="10"/>
      </label>
      <br>
      <label class="label">
        <span>Repeat New Password</span>
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
      {#if form?.message}
        <span class="text-primary-500-400-token">
          {form.message}
        </span>
      {/if}
      {#if form?.ratelimited}
        <span class="text-primary-500-400-token">
          You are trying to do that too fast. Wait a minute and try again.
        </span>
      {/if}
      {#if form?.invalidToken}
        <span class="text-primary-500-400-token">
          Your reset token is invalid or expired. Please <a href="/auth/login/forgot-password">request a new one</a>
        </span>
      {/if}


      <br>
      <button class="btn variant-glass-primary" disabled={firstPassword !== secondPassword || !turnstileCompleted}>Reset Password</button>
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