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

    let lastSocketData: WdbMessage;

    socket.on('state', (message: string) => {
      // const body = {"live":false,"wan":true,"title":"This Is A Royal Disaster - WAN Show March 15, 2024","description":"<p>Check out Ridgeâs Anniversary Sale and get Free Shipping at <a href=\"https://www.ridge.com/wan\" rel=\"noopener noreferrer\" target=\"_blank\">https://www.ridge.com/wan</a></p><p><br></p><p>Visit<a href=\"https://www.squarespace.com/WAN\" rel=\"noopener noreferrer\" target=\"_blank\"> https://www.squarespace.com/WAN</a> and use offer code WAN for 10% off</p><p><br></p><p>Save 15% with our offer code WANSHOW at<a href=\"https://vessi.com/WANSHOW\" rel=\"noopener noreferrer\" target=\"_blank\"> https://vessi.com/WANSHOW</a></p><p><br></p><p>Podcast Download: TBD</p>","thumbnail":"https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/888565524674927_1710554857698.jpeg","imminence":3,"textImminence":"IMMINENT"};
      const body = JSON.parse(message) as WdbMessage;
      body.isWAN = body.wan;
      delete body.wan;

      if(!lastSocketData) lastSocketData = body;

      wdbSocketState.update(value => {
        value.lastReceive = Date.now();
        return value;
      });


      if(body.imminence < 3 && lastSocketData.imminence >= 3) {
        // only set last socket data, to prevent flickering due to wandb bug
        lastSocketData = body;
      } else {
        lastSocketData = body;
        floatplaneState.set(body as WanDb_FloatplaneData);
      }
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
