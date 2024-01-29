<script>

  import { browser, dev } from "$app/environment";
  import { getPushSubscription, urlB64ToUint8Array } from "$lib/notifications/notificationUtils";
  import { serviceWorker } from "$lib/stores";

  import { PUBLIC_VAPID_KEY } from "$env/static/public"
  import { onMount } from "svelte";
  import NotificationSettings from "$lib/notifications/NotificationSettings.svelte";
  import { page } from "$app/stores";

  import ExclamationTriangleFill from "svelte-bootstrap-icons/lib/ExclamationTriangleFill.svelte";

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let pushSubscription = new Promise(() => {});
  let givenUp = false;

  onMount(() => {
    let tries = 0;
    function set() {
      if(serviceWorker) {
        pushSubscription = getPushSubscription();
      } else if(tries < 60) {
        tries++;
        setTimeout(set, 500)
      } else {
        givenUp = true;
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

  const iOS = browser ? !!navigator.userAgent.match(/iPad/i) || !!navigator.userAgent.match(/iPhone/i) : false;

</script>

<svelte:head>
  <title>Push Notification Settings - {$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
</svelte:head>

{#if notificationPromptOpen}
  <button class="dark-background absolute top-0 left-0 w-screen h-screen flex items-center justify-items-center" on:click={() => notificationPromptOpen = false}>
    <span class="self-center justify-self-center mx-auto">
      Click "Allow" to enable notifications
    </span>
  </button>
{/if}


<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Push Notification Settings</li>
</ol>

<div class="limit mx-auto m-2 mb-96 p-2">
  <h1>Push Notifications</h1>

  Subscribe to push notifications to get a notification when the show is imminent, or when the pre/main show start.<br>
  <br>
  This is an alternative to floatplane/youtube notifications which can be significantly delayed.
  You should receive these notifications within 5 seconds of the event happening (usually less)
  {#if iOS}
    <br>
    <aside class="alert variant-ghost-warning">
      <div><ExclamationTriangleFill/></div>
      <div class="alert-message">
        <h3 class="h3">Extra steps are required!</h3>
        <p>
          Because you appear to be on iOS, extra steps are required for push notifications to work.<br>
          <a href="/notifications/ios-add-to-home-screen">More info and instructions</a>
        </p>
      </div>
    </aside>
  {/if}

  <br>
  <br>
  {#if givenUp}
    <span class="text-red-500">
      Failed to load service worker registration. Make sure you are not in a private tab, and try reloading.
    </span>
    <br>
    If the issue persists, <a href="/support">contact me</a>
    <br>
    <br>
  {/if}
  {#await pushSubscription}
    {#if !givenUp}
      <span class="opacity-75">
        Loading your notification preferences
      </span>
    {/if}
  {:then sub}
    {#if sub}
      You are subscribed!
      <br>
      <br>
      <NotificationSettings/>
      <br>
      <br>
      <br>
      <button class="btn variant-ghost-error" on:click={unsubscribe}>
        Unsubscribe from all
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

  @media all and (display-mode: standalone) {
      .alert {
          display: none;
      }
  }
</style>