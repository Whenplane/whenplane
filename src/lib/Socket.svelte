<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { overwriteData } from "$lib/stores.ts";
  import type { MMJobData } from "$lib/utils.ts";
  import { isNearWan } from "$lib/timeUtils.ts";

  interface Props {
    events: string[];
    invalidate?: boolean;
    autoInvalidateAfterNoData?: boolean;
  }

  let { events, invalidate = true, autoInvalidateAfterNoData = false }: Props = $props();

  const dispatch = createEventDispatcher<{detail: {data: MMJobData}}>();

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

      overwriteData.lastMessage = Date.now();
      if(typeof data === "string") {
        const newData = JSON.parse(data);
        // dont invalidate if the new data is exactly the same as the old data
        if(JSON.stringify(newData) === JSON.stringify(overwriteData.data)) return;
        overwriteData.data = newData;
      } else if(typeof data === "object") {
        if(JSON.stringify(data) === JSON.stringify(overwriteData.data)) return;
        overwriteData.data = data;
      } else {
        console.error("Unknown data type", typeof data)
      }

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
      let randomOffset = 15e3 * Math.random();
      let interval = setInterval(async () => {
        // shuffle offset every minute so its not always the same client
        if(i++ % 12 === 0) {
          randomOffset = 15e3 * Math.random();
        }

        // minimum of 5 seconds when near wan time. Minimum of 30 when not near wan time
        const baseLength = isNearWan() ? 5e3 : 30e3;

        if(Date.now() - overwriteData.lastMessage > baseLength+randomOffset && i > 3) {
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