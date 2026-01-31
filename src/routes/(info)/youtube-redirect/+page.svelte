<script lang="ts">
  import { run } from 'svelte/legacy';


  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import { page } from "$app/state";

  import { getTimePreference } from "$lib/prefUtils.ts";

  let { data } = $props();

  let sendNotification = browser ? (localStorage.ytrNotif === "true") : false;
  let errorText = $state("");

  let sendNotificationToggle = $state(sendNotification);

  async function toggleNotifications() {
    if(sendNotification) {
      sendNotification = false;
      sendNotificationToggle = false;
      errorText = "";
    } else {
      const hasPermission = await Notification.requestPermission();
      console.log({hasPermission})
      if(hasPermission !== "granted") {
        errorText = "You must allow notifications in order to receive notifications!";
        sendNotification = false;
        sendNotificationToggle = false;
      } else {
        sendNotification = true;
        sendNotificationToggle = true;
      }
    }
    localStorage.setItem("ytrNotif", sendNotification+"");
  }

  let lastCheck = $state(new Date());

  onMount(() => {
    let i = setInterval(() => {
      invalidateAll();
      lastCheck = new Date();
    }, 5e3);
    return () => clearInterval(i);
  });

  run(() => {
    if(data.youtube.videoId && browser) {

      new Notification("WAN is starting!", {
        body: "A Youtube page for today's WAN show is now available and is being opened.",
        icon: "/wan.webp"
      });

      location.href = "https://youtube.com/watch?v=" + data.youtube.videoId + "&ref=whenplane.com";
    }
  });
</script>
<svelte:head>
  <title>🔴 Youtube Auto-redirector</title>
  <meta name="description" content="This page will automatically redirect you to the youtube live page for the WAN show as soon as it is available.">
  <link rel="canonical" href="https://whenplane.com{$page.url.pathname}"/>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Automatic Youtube Redirector</li>
</ol>
<br>

<div class="limit mx-auto p-1">
  <h1>Automatic Youtube Redirector</h1>
  This page will automatically redirect you to the youtube live page for the WAN show as soon as it is available.<br>
  <br>
  You must keep this page open. It will replace this tab.<br>
  <br>
  <a href="https://www.youtube.com/linustechtips/streams">Go to the LTT stream list instead</a><br>
  <br>
  <br>
  <span class="opacity-70">
    Last checked {lastCheck.toLocaleTimeString(undefined, {timeStyle: "medium", hour12: getTimePreference()})}
  </span>
  <br>
  <br>
  {#if !browser || ('Notification' in window)}
    <h2>Notification</h2>
    Should we send you a notification right before redirecting?<br>
    You must keep this page open to get the notification.<br>
    {#if errorText}
      <span class="red">
        {errorText}
      </span>
    {/if}
    <br>
    <SlideToggle name="ytrNotifToggle" bind:checked={sendNotificationToggle} on:change={toggleNotifications}/>
  {/if}
  <br>
<!--  <pre>{JSON.stringify(data, undefined, '\t')}</pre>-->
</div>


<style>
  .red {
      color: red;
  }
</style>