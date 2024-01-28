<script lang="ts">
  import {onDestroy, onMount} from "svelte";
  import * as socketio from "socket.io-client";
  import {floatplaneState, wdbSocketState} from "$lib/stores.ts";

  import type { WanDb_FloatplaneData } from "$lib/wdb_types.ts";

  // This is the message format that the WDB websocket sends to the client
  interface WdbMessage {
    live: boolean,
    wan?: boolean,
    isWAN?: boolean,
    title: string,
    description: string,
    thumbnail: string,
    imminence: 0 | 1 | 2 | 3 | 4,
    textImminence: "Distant" | "Today" | "Soon" | "Imminent" | "Live"
  }

  let socket: socketio.Socket | undefined
  onMount(() => {
    socket = socketio.connect('wss://mq.thewandb.com', {transports: ['websocket']});
    socket.on('connect', () => {
      console.debug("[whenplane] Connected to WDB")
      if (!socket) return;
      socket.emit('message', JSON.stringify({
        type: 2,
        payload: 'live'
      }));
      // socket.emit(, 'status');
    });

    socket.on('state', (message: string) => {
      const body = JSON.parse(message) as WdbMessage;
      body.isWAN = body.wan;
      delete body.wan;
      floatplaneState.set(body as WanDb_FloatplaneData);

      wdbSocketState.update(value => {
        value.lastReceive = Date.now();
        return value;
      });
    });

    // stomp.connect({
    //     host: 'prod_whenplane_com',
    //     login: 'whenplane',
    //     passcode: 'cWDK2KUpPCw3AW'
    // }, () => {
    //
    //   stomp?.subscribe('/exchange/status', (message) => {
    //     try {
    //       const body = JSON.parse(message.body) as WdbMessage;
    //       body.isWAN = body.wan;
    //       delete body.wan;
    //       floatplaneState.set(body as WanDb_FloatplaneData);
    //
    //       wdbSocketState.update(value => {
    //         value.lastReceive = Date.now();
    //         return value;
    //       });
    //       message.ack()
    //     } catch (e) {
    //       message.nack();
    //     }
    //   }, { 'ack': 'client' });
    // })
  })

  onDestroy(() => {
    if (socket) {
      socket.disconnect();
      socket = undefined;
    }
  })
</script>
