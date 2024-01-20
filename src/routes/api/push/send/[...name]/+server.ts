import { error, type RequestHandler } from "@sveltejs/kit";

import {PUSH_KEY} from "$env/private/static"
import type { NotificationRows } from "../../settings/+server.ts";
import type { D1Database } from "@cloudflare/workers-types";
import { getClosestWan, getUTCDate } from "$lib/timeUtils.ts";

import type {PushMessage} from '@block65/webcrypto-web-push';

export const POST = (async ({platform, params, request}) => {

  const { key } = await request.json();

  if(key != PUSH_KEY) throw error(401);
  const name = params.name;
  if(!name) throw error(400);

  const db: D1Database = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  const message = messages[name];
  if(!message) throw error(400);

  const subs = await db.prepare("select * from notifications where ? = 1")
    .bind(name)
    .all()
    .then(r => r.results as unknown as NotificationRows[]);


  let messages = [];


}) satisfies RequestHandler;


const messages: {[key: string]: PushMessage} = {
  imminent: {
    data: {
      title: "The WAN show is imminent!",
      body: "The pre show should be starting in the next 10 minutes. Get ready!"
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "imminent-" + getUTCDate(getClosestWan())
    }
  }
}