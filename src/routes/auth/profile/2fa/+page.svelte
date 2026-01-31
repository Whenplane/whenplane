<script lang="ts">
  import { run } from 'svelte/legacy';

  import {Accordion, AccordionItem, CodeBlock} from "@skeletonlabs/skeleton";
  import {onMount} from "svelte";
  import {enhance} from "$app/forms";
  import { timeString } from "$lib/timeUtils.ts";
  import { browser } from "$app/environment";

  let { data, form } = $props();

  let expiration = $derived((data?.expiration ?? 0) * 1000);
  run(() => {
    if(browser) console.log(data)
  });

  let countdownString = $state("2m 0s");

  let expired = $state(false);
  onMount(() => {
    let interval = setInterval(() => {
      const timeTilExpiration = expiration - Date.now();
      if(timeTilExpiration >= 0) {
        countdownString = timeString(timeTilExpiration) ?? "0s";
      } else {
        countdownString = "0s";
        expired = true;
        clearInterval(interval);
      }
    }, 1e3);

    return () => clearInterval(interval);
  })
</script>

<br>
<div class="limit mx-auto text-left">
  {#if form?.success}
    <div class="card mx-auto p-4">
      {#if data.has2fa}
        You are now successfully enrolled in two-factor authentication!<br>
        You will need to provide your two-factor code the next time you log in.
      {:else}
        You have successfully un-enrolled in two-factor authentication.<br>
        You will no longer need to provide your two-factor code the next time you log in.<br>
        <br>
        For security reasons, it is strongly recommended that you use two-factor authentication
      {/if}
    </div>
    <br>
  {/if}
  {#if form?.message}
        <span style="color: red">
            {form.message}
        </span>
  {/if}
  <h1>Two-factor Authentication</h1>
  <div class="card mx-auto p-4 mb-32">
    {#if data.has2fa}
      Please confirm <b>removing</b> two-factor authentication by entering your two-factor code<br>
      <form method="POST" action="?/unenroll" class="mt-2" use:enhance>
        <input name="confirmation-code" class="input px-2 inline-block width-initial" placeholder="Two-factor Code">
        <button class="btn btn-sm variant-ghost-warning">Remove two-factor authentication</button>
      </form>
      <br>
      If you have lost your two-factor authentication method, please <a href="mailto:support@whenplane.com">contact support</a>
    {:else}
      {#if !expired}
        <img src="/api/qrcode?id={data.id}" class="mx-auto" alt="Two-factor Authentication QR Code">
      {:else}
        <div class="flex qr-box items-center justify-items-center">
          <div class="mx-auto">
            Your QR Code has expired. Please refresh this page to get a new QR code
          </div>
        </div>
      {/if}

      <div class="text-center advanced">
        {#if !expired}
          <Accordion class="inline-block">
            <AccordionItem>
              {#snippet summary()}
                            View text version
                          {/snippet}
              {#snippet content()}
                          
                  <div class="text-left">
                    <CodeBlock language="TOTP" code={data.twoFactorURI}/>
                  </div>
                
                          {/snippet}
            </AccordionItem>
          </Accordion>
        {/if}
      </div>

      <p class="mt-2">
        Scan the above QR code to add two-factor to your authentication app.<br>
        <br>
        If you don't have an authenticator app, Google Authenticator is a fairly standard one,
        but any TOTP-compatible app or password manager will work.<br>
        <br>
        {#if !expired}
          The QR Code will expire in {countdownString} so be quick!
        {/if}
        <br>
        <br>
        After adding the QR code to your authentication app, please enter the code below to confirm enabling two-factor authentication
      </p>
      <form method="POST" action="?/enroll" class="mt-2" use:enhance>
        <input class="hidden" name="id" value={data.id}>
        <input name="confirmation-code" class="input px-2 inline-block width-initial" placeholder="Two-factor Code">
        <button class="btn btn-sm variant-ghost-success" disabled={expired}>Enable two-factor authentication</button>
      </form>
    {/if}
  </div>
</div>

<style>
    .width-initial {
        width: initial !important;
    }

    img {
        @apply qr-box;
    }

    .advanced {
        min-height: 2.66em;
    }

    .qr-box {
        height: min(45vh, 80vw);
        color: red;
    }
</style>