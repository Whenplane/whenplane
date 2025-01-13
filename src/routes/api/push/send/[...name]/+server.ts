import { error, type RequestHandler } from "@sveltejs/kit";

import { PUSH_KEY } from "$env/static/private"
import type { NotificationRows } from "../../settings/+server.ts";
import type { D1Database, Queue } from "@cloudflare/workers-types";
import { getClosestWan, getUTCDate } from "$lib/timeUtils.ts";

import type {PushMessage} from '@block65/webcrypto-web-push';

export const POST = (async ({platform, params, request, url}) => {

  const { key } = await request.json();

  const isTest = params.name?.includes("test") ?? false;
  const name = params.name?.replaceAll("test", "");

  if(key != PUSH_KEY && !isTest) throw error(401);

  if(!name) throw error(400);

  const db: D1Database | undefined = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  const message = JSON.parse(JSON.stringify(messages[name]));
  if(!message) throw error(400);

  for (const searchKey of url.searchParams.keys()) {
    message.data.title = message.data.title.replaceAll("{" + searchKey + "}", url.searchParams.get(searchKey))
    message.data.body = message.data.body.replaceAll("{" + searchKey + "}", url.searchParams.get(searchKey))
  }
  if(url.searchParams.has("image")) {
    message.data.image = url.searchParams.get("image");
  }


  let subs;

  if(isTest) {
    subs = await db.prepare("select * from notifications where endpoint_hash = ?")
      .bind("4a446187f188ea1fb29bfb1bae13ccbc605a8deb89230d36658cf30f8d5c6418")
      .all()
      .then(r => r.results as unknown as NotificationRows[]);
  } else {
    subs = await db.prepare("select * from notifications where " + name.replace(/\W/g, '') + " = 1")
      .all()
      .then(r => {
        console.log(JSON.stringify(r, undefined, '\t'))
        return r.results as unknown as NotificationRows[];
      });
  }

  console.log("Got " + subs.length + " subs for " + name)


  const pushMessages: NotificationMessage[] = subs.filter(sub => sub.subscription).map(sub => {
    return {
      type: name,
      subscription: JSON.parse(<string>sub.subscription) as PushSubscription,
      sendTime: Date.now(),
      message
    }
  });

  const queue: Queue<NotificationMessage> = platform?.env?.NOTIFICATION_QUEUE;

  let batch: NotificationMessage[] = [];
  for (const pushMessage of pushMessages) {
    batch.push(pushMessage);

    if(batch.length >= 99) {
      await queue.sendBatch(batch.map(body => {
        return { body };
      }));
      batch = [];
    }
  }

  if(batch.length > 0) {
    await queue.sendBatch(batch.map(body => {
      return { body };
    }));
  }

  return new Response("", {
    status: 204,
    headers: {
      "x-messages-queued": pushMessages.length+""
    }
  });
}) satisfies RequestHandler;


const messages: {[key: string]: PushMessage} = {
  imminent: {
    data: {
      title: "The WAN show is imminent!",
      body: "The pre show should be starting in the next 10 minutes. Get ready! \"{title}\""
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "imminent-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    }
  },

  preshow_live: {
    data: {
      title: "The WAN pre-show has started!",
      body: "The pre-show is now live (everywhere except for youtube) \"{title}\"",
      tag: "preshow_live-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "preshow_live-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    }
  },

  mainshow_live: {
    data: {
      title: "The WAN show has started!",
      body: "The main show is now live everywhere. \"{title}\"",
      tag: "wanshow_live-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "wanshow_live-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    }
  },

  other_streams: {
    data: {
      title: "A non-wan stream has started",
      body: "\"{title}\"",
      tag: "imminent-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "imminent-" + getUTCDate(getClosestWan()).replaceAll("/", "-")
    }
  },

  elijah_stream: {
    data: {
      title: "Elijah (BocaBola) is streaming on Twitch!",
      body: "\"{title}\"",
      tag: "elijah_stream-" + getUTCDate().replaceAll("/", "-")
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "elijah_stream-" + getUTCDate().replaceAll("/", "-")
    }
  },

  test: {
    data: {
      title: "Test Notification",
      body: "If you are getting this and are not me, please contact support@whenplane.com. \"{title}\"",
      tag: "test-" + new Date().getUTCMinutes()
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "test-" + new Date().getUTCMinutes()
    }
  }
}

export type NotificationMessage = {
  id?: number,
  type: string,
  subscription: PushSubscription,
  message: PushMessage,
  sendTime: number,
  isDummy?: boolean
}
