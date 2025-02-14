<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { overwriteData } from "$lib/stores.ts";
  import type { MMJobData } from "$lib/utils.ts";

  export let events: string[];
  export let invalidate = true;
  export let autoInvalidateAfterNoData = false;

  const dispatch = createEventDispatcher<{data: {data: MMJobData}}>();

  if(!events || events.length < 1) {
    console.error("Missing required events parameter");
  }


  let reconnectAttempt = 0;

  let webSocket: WebSocket;
  let shuttingDown = false;
  let first = true;
  let lastInvalidate = 0;
  function createWebSocket() {
    webSocket = new WebSocket("wss://sockets.whenplane.com/socket?events=" + encodeURIComponent(events.join(",")));

    webSocket.onopen = async () => {
      if(!first) {
        if(Date.now() - lastInvalidate > 60e3) {
          // if the websocket is reconnecting, go ahead and invalidate since it could be from a device sleep
          lastInvalidate = Date.now();
          await invalidateAll();
        }
      }
      first = false;
      reconnectAttempt = 0;
    }

    webSocket.onclose = (e) => {
      if(shuttingDown) return;

      const delay = Math.min(Math.pow(2, ++reconnectAttempt) - 1, 30);
      if(delay > 2) console.debug("[whenplane:ws] WebSocket closed, reconnecting in", delay, "seconds");

      setTimeout(() => {
        console.debug("[whenplane:ws] Reconnecting websocket due to disconnection: ", e.code, e.reason)
        createWebSocket()
      }, delay * 1e3);

    }

    webSocket.onmessage = async (e) => {
      // for ping messages, only record that we got a message.
      if(e.data === "pong") {
        overwriteData.lastMessage = Date.now();
        return;
      }
      const data = JSON.parse(e.data);

      dispatch("data", { data });
      console.debug("[whenplane:ws] Received data:", data);

      if(typeof data === "string") {
        overwriteData.data = JSON.parse(data);
      } else if(typeof data === "object") {
        overwriteData.data = data;
      } else {
        console.error("Unknown data type", typeof data)
      }
      overwriteData.lastMessage = Date.now();

      if(invalidate) {
        lastInvalidate = Date.now();
        await invalidateAll();
      }
    }
  }


  if(browser) {
    createWebSocket();
  }

  if(autoInvalidateAfterNoData) {
    onMount(() => {
      let i = 0
      // we pick a random offset so hopefully there wont be a bunch of browsers requesting data at once
      let randomOffset = 10e3 * Math.random();
      let interval = setInterval(async () => {
        // shuffle offset every minute so its not always the same client
        if(i++ % 12 === 0) {
          randomOffset = 10e3 * Math.random();
        }
        if(Date.now() - overwriteData.lastMessage > 5e3+randomOffset && i > 3) {
          if(webSocket.readyState === webSocket.OPEN) {
            webSocket.send("ping");
            await invalidateAll();
          } else {
            console.warn("[whenplane socket] socket is not open! Unable to send ping");
          }
        }
      }, 5e3);
      return () => clearInterval(interval);
    })
  }

  onDestroy(() => {
    shuttingDown = true;
    if(webSocket && webSocket.readyState == WebSocket.OPEN) {
      webSocket.close();
    }
  })
</script>