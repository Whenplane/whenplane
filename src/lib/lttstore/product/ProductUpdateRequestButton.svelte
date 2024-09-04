<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { ProgressRadial } from "@skeletonlabs/skeleton";


  let promise: Promise<{message?: string, success?: true}>;
  let status = {done: true};

  function request() {
    const thisStatus = {done: false}
    promise = fetch(`/lttstore/products/${$page.params.handle}/requestUpdate`, {
      method: "POST",
      headers: {
        "Accept": "application/json"
      }
    })
      .then(r => r.json())
      .then(r => {
        thisStatus.done = true;
        status = status;
        return r;
      })
    status = thisStatus;
  }
</script>

<button disabled={!browser || !status.done} class="btn variant-filled-secondary" on:click={request}>
  Request Update
</button>
<br>
{#await promise}
  <ProgressRadial width="w-6" stroke={250}/>
{:then data}
  {#if data?.message}
    <span class="text-red-500">
      {data.message}
    </span>
  {/if}
  {#if data?.success}
    <span class="text-green-300">
      Update queued! Please reload this page in a few minutes.
    </span>
  {/if}
{/await}