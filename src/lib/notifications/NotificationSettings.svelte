<script lang="ts">
  import { browser } from "$app/environment";
  import { getPushSubscription, lang, sha256 } from "$lib/notifications/notificationUtils";
  import type { NotificationRows } from "../../routes/api/push/settings/+server.js";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import { beforeNavigate } from "$app/navigation";
  import type { D1Result } from "@cloudflare/workers-types";

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let settingsFetch: Promise<NotificationRows> = browser ? fetchSettings() : new Promise(() => {});
  let savingSettings: Promise<D1Result> = Promise.resolve(undefined);

  let knownSettings: NotificationRows;
  let stagedSettings: NotificationRows;

  $: {
    console.log(JSON.stringify(knownSettings));
    console.log(JSON.stringify(stagedSettings));
    console.log(JSON.stringify(stagedSettings) === JSON.stringify(knownSettings))
  }

  async function fetchSettings() {
    const sub = await getPushSubscription();
    if(!sub) {
      location.href = '';
      return null;
    }
    const hash = await sha256(sub.endpoint)
    const response = await fetch("/api/push/settings?hash=" + hash);
    if(response.status === 404) {
      await sub.unsubscribe();
      location.href = '';
      return null;
    }
    const json = await response.json();
    knownSettings = JSON.parse(JSON.stringify(json));
    stagedSettings = JSON.parse(JSON.stringify(json));
    return json;
  }

  async function saveSettings() {

    const sub = await getPushSubscription();
    if(!sub) {
      location.href = '';
      return null;
    }
    const hash = await sha256(sub.endpoint)

    savingSettings = fetch("/api/push/settings?hash=" + hash, {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(stagedSettings)
    })
      .then(r => {
        if(r.ok) fetchSettings();
        return r;
      })
      .then(r => r.json())
  }

  beforeNavigate(({cancel}) => {
    if(JSON.stringify(stagedSettings) !== JSON.stringify(knownSettings) && !confirm("You have unsaved changes! Are you sure you want to exit?")) {
      cancel();
    }
  });

</script>

<svelte:window on:beforeunload={(event) => {
    if(JSON.stringify(stagedSettings) === JSON.stringify(knownSettings)) return;
    event.preventDefault();
    const message = "You have unsaved changes! Are you sure you want to exit?";
    event.returnValue = message;
    return message;
}}/>

{#await settingsFetch}
  <span class="opacity-75">Loading notification settings</span>
{:then settings}
<!--  <pre>{JSON.stringify(knownSettings, null, '\t')}</pre>-->
<!--  <pre>{JSON.stringify(stagedSettings, null, '\t')}</pre>-->

  <div class="card p-3">
    {#each Object.keys(stagedSettings).filter(n => n !== "endpoint_hash") as settingName, i}
      {@const display = lang[settingName]}
      {#if display}
        {#if i !== 0}
          <br>
        {/if}
        <SlideToggle
          name={settingName}
          active="bg-primary-500"
          size="sm"
          checked={stagedSettings[settingName] === 1}
          on:change={e => {
            stagedSettings[settingName] = e.target?.checked ? 1 : 0;
            stagedSettings = stagedSettings;
          }}
        >
          <b>{display.name}</b><br>
          {display.description}
        </SlideToggle>

        <br>
      {/if}
    {/each}
  </div>
  <br>
  <button
    class="btn variant-ghost-success"
    disabled={JSON.stringify(stagedSettings) === JSON.stringify(knownSettings)}
    on:click={saveSettings}
  >
    Save
  </button>
{/await}