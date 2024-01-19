<script>

  import { browser, dev } from "$app/environment";
  import { getPushSubscription, urlB64ToUint8Array } from "$lib/notifications/notificationUtils";
  import { serviceWorker } from "$lib/stores";

  import { PUBLIC_VAPID_KEY } from "$env/static/public"
  import { onMount } from "svelte";

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let pushSubscription = new Promise(() => {});

  onMount(() => {
    let tries = 0;
    function set() {
      if(serviceWorker) {
        pushSubscription = getPushSubscription();
      } else if(tries < 60) {
        tries++;
        setTimeout(set, 500)
      }
    }
    set()
  })

  let notificationPromptOpen = false;


  async function subscribe() {
    if(!serviceWorker) {
      console.error("Service worker not registered! Unable to subscribe to push notifications without the service worker");
      return;
    }

    notificationPromptOpen = true;
    const requestingNotificationPromise = Notification.requestPermission();
    requestingNotificationPromise.finally(() => notificationPromptOpen = false);

    const hasPermission = await requestingNotificationPromise;
    if(hasPermission !== "granted") {
      console.error("Notification permission denied!", {hasPermission});
      return;
    }

    const subscription = await serviceWorker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    console.debug("Preparing to submit subscription:", subscription);

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(subscription)
    })

    pushSubscription = serviceWorker.pushManager.getSubscription();
  }


  async function unsubscribe() {
    if(!serviceWorker) return;

    const sub = await serviceWorker.pushManager.getSubscription();

    if(sub) {
      await sub.unsubscribe()
    }

    pushSubscription = serviceWorker.pushManager.getSubscription();

    // TODO: delete from server too
  }

</script>

{#if notificationPromptOpen}
  <button class="dark-background absolute top-0 left-0 w-screen h-screen flex items-center justify-items-center" on:click={() => notificationPromptOpen = false}>
    <span class="self-center justify-self-center mx-auto">
      Click "Allow" to enable notifications
    </span>
  </button>
{/if}


<div class="limit mx-auto">
  <h1>Push Notifications</h1>
  {#await pushSubscription}
    <span class="opacity-75">
      Loading your notification preferences
    </span>
  {:then sub}
    <pre>{JSON.stringify(sub)}</pre>
    {#if sub}
      You are subscribed!
      <br>
      <br>
      <button class="btn variant-ghost-error" on:click={unsubscribe}>
        Unsubscribe
      </button>
    {:else}
      You are not subscribed to push notifications.<br>
      <br>
      {#if Notification.permission === "denied"}
        <span class="text-red-500">
          You have specifically denied notification permissions for this site.
          You must allow notifications before enabling notifications.
          <br>
          Usually you can find this setting to the left of the URL
        </span>
        <br>
        <br>
      {/if}
      <button class="btn variant-ghost-success" on:click={subscribe}>
        Subscribe
      </button>
    {/if}
  {/await}
</div>


<style>
  .dark-background {
      background-color: rgba(0, 0, 0, 0.6);
  }
</style>