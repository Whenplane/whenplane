<script lang="ts">

import { page } from "$app/stores";
</script>
<svelte:head>
  <title>iOS Push Notification Setup - Whenplane</title>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/notifications">Notifications</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">iOS Push Setup</li>
</ol>

<div class="limit p-2 mb-96 mx-auto">
  <h1>Adding Whenplane to the Home Screen</h1>
  On iOS, in order to be able to get Web Push Notifications, you must first add the site to your home screen. Doing so is very simple and only takes a few seconds.
  <br>
  <br>
  First, open Whenplane in Safari. You should open the home page.<br>
  Click the Share button:
  <br>
  <br>
  <img src="/screenshots/add-to-home-screen-1.webp" width="1284" height="2778" alt="Tap the 'Share' icon at the bottom of the screen">
  <br>
  <br>
  Then, click "Add to Home Screen":
  <br>
  <br>
  <img src="/screenshots/add-to-home-screen-2.webp" width="1284" height="2778" alt="Tap the 'Add to Home Screen' in the share sheet">
  <br>
  <br>
  I would recommend changing the title to just "Whenplane". Then click "Add"
  <br>
  <br>
  <img src="/screenshots/add-to-home-screen-3.webp" width="1284" height="2778" alt="Tap the 'Add' button in the upper right">
  <br>
  <br>
  Next, go to your home screen and find the Whenplane icon you just added. Open it, click about in the lower right,
  then scroll to the bottom and go to the bottom and click "Push Notification Settings".
  You can then click "Subscribe" and it will ask for permission to send you notifications.
  Once you click "Allow", you can change the settings to only get notifications for what you want.
  <br>
  <br>
  <br>
  Here is a screen recording of the complete process.
  Note that this was taken before push notifications was fully released, so there might be some differences,
  especially in some of the text on the notification page. The process is still the same

  <br>
  <br>
  <div class="video inline-block overflow-hidden">
    <video controls width="1284" height="2778">
      <source src="https://images.ajg0702.us/ios_whenplane_push_notifs.mp4" type="video/mp4">
    </video>
  </div>
</div>
<span class="clear">.</span>

<style>
  img, .video {
      border: 1px solid rgba(255, 255, 255, 0.25);
  }
  img {
      border-radius: 50px;
  }
  .video {
      border-radius: 12px;
  }
</style>