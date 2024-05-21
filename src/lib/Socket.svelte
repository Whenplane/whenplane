<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onDestroy } from "svelte";

  export let events: string[];

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
        if(Date.now() - lastInvalidate < 60e3) {
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
      const data = JSON.parse(e.data);

      console.debug("[whenplane:ws] Received data:", data);

      lastInvalidate = Date.now();
      await invalidateAll();
    }
  }


  if(browser) {
    createWebSocket();
  }

  onDestroy(() => {
    shuttingDown = true;
    if(webSocket && webSocket.readyState == WebSocket.OPEN) {
      webSocket.close();
    }
  })
</script>