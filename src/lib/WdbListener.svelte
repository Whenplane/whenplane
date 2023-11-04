<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import webstomp, { Client } from "webstomp-client";
  import type { WanDb_FloatplaneData } from "$lib/utils.ts";
  import { floatplaneState, wdbSocketState } from "$lib/stores.ts";

  // This is the message format that the WDB websocket sends to the client
  interface WdbMessage {
    live: boolean,
    wan?: boolean,
    title: string,
    description: string,
    thumbnail: string,
    imminence: 0 | 1 | 2 | 3,
    textImminence: "Distant" | "Today" | "Soon" | "Imminent"
  }

  let stomp: Client | undefined;
  onMount(() => {
    stomp = webstomp.client('wss://mq.thewandb.com/ws', {debug: false});
    stomp.connect({
        host: 'prod_whenplane_com',
        login: 'whenplane',
        passcode: 'cWDK2KUpPCw3AW'
    }, () => {

      stomp?.subscribe('/exchange/status', (message) => {
        try {
          const body = JSON.parse(message.body) as WdbMessage;
          body.isWAN = body.wan;
          delete body.wan;
          floatplaneState.set(body as WanDb_FloatplaneData);

          wdbSocketState.update(value => {
            value.lastReceive = Date.now();
            return value;
          });
          message.ack()
        } catch (e) {
          message.nack();
        }
      }, { 'ack': 'client' });

    })
  })

  onDestroy(() => {
    if(stomp) {
      stomp.disconnect(() => stomp = undefined);
    }
  })
</script>
