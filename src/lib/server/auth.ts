import type { D1Database } from "@cloudflare/workers-types";
import { createMFResponse } from "$lib/server/MfResponseConverter.ts";
import { json } from "@sveltejs/kit";
import base32 from "hi-base32";
import * as OTPAuth from "otpauth";

export async function createTables(db: D1Database) {
  await db.prepare("create table if not exists users (username text, email text, email_verified number, password text, `2fa` text, created number)")
    .run();
  await db.prepare("create table if not exists sessions (sessionID text UNIQUE, username text, expires number)")
    .run();

  await db.prepare("create index if not exists users_username on users(username)").run()
  await db.prepare("create index if not exists users_email on users(email)").run()

  await db.prepare("create index if not exists sessions_sid on sessions(sessionID)").run()
}


const memorySessionCache: {[sid: string]: {cachedTime: number, userData: SessionData | null}} = {};
export async function getSession(platform?: App.Platform, sessionID?: string, includeEmail = false, include2fa = false, allowVerifying = false): Promise<SessionData | null> {

  if(!sessionID) return null;

  if(sessionID.endsWith(":verifying") && !allowVerifying) return null;

  let session_cache_time = 5e3;
  if(sessionID.endsWith(":verifying")) {
    session_cache_time = 1e3; // only cache 2fa sessions for 1 second
  }

  const db = platform?.env?.AUTH;
  if(!db) {
    console.warn("Missing auth DB! Unable to get sessions");
    return null;
  }

  // check memory cache first (since it'll always be fastest)

  const memoryCacheMatch = memorySessionCache[sessionID];

  if(memoryCacheMatch && Date.now() - memoryCacheMatch.cachedTime < session_cache_time) {
    return memoryCacheMatch.userData
  }

  // if no match (or expired match) in memory cache, check cache api
  //  the cache api will cache things in the same datacenter.
  //  so if there is multiple instances of whenplane running in a datacenter, they can share this.
  //  It is significantly slower than memory (full cycle takes 10-30ms),
  //  but doesn't cost anything so might as well use it in front of the database

  const cacheRequest = new Request("https://whenplane/sessions/" + sessionID)

  let cfCache;
  if(typeof caches !== "undefined") {
    cfCache = await caches.open("whenplane:sessions");

    const cacheMatch = await cfCache.match(cacheRequest);

    if(cacheMatch) {
      const cacheTimeHeader = cacheMatch.headers.get("x-cache-time");
      if(!cacheTimeHeader) console.warn("Cached session data does not have cache time header!")
      const cachedTime = new Date(cacheTimeHeader ?? 0);
      if(Date.now() - cachedTime.getDate() < session_cache_time) {
        const data = await cacheMatch.json().then(r => r.data);
        memorySessionCache[sessionID] = {
          cachedTime: cachedTime.getTime(),
          userData: data
        };
        return data;
      }
    }
  } else {
    console.warn("Cache API is missing!")
  }

  // all the caches don't have this session, fetch it from the db

  let session = await db.prepare("select username,expires from sessions where sessionID=?")
    .bind(sessionID)
    .first<{username: string, expires: number}>()

  if(session && session.expires - Date.now() <= 0) {
    platform?.context?.waitUntil(
      db.prepare("delete from sessions where sessionID=?")
        .bind(sessionID)
        .run()
    )
    session = null;
  }

  let user: SessionData | null = null;
  if(session) {
    user = await db.prepare("select username" + (includeEmail ? ",email" : "") + ",email_verified,created" + (include2fa ? ",`2fa`" : "") + " from users where username = ?")
      .bind(session.username)
      .first<UserData>()
      .then(r => {
        if(!r) return r;
        return {
          ...r,
          sessionID
        }
      })
  }


  memorySessionCache[sessionID] = {
    cachedTime: Date.now(),
    userData: user
  }
  platform?.context?.waitUntil(
    cfCache?.put(cacheRequest, await createMFResponse(json(
      {
        data: user,
      },
      {
        headers: {
          "x-cache-time": new Date().toISOString()
        }
      }
    )) as Response)
  )
  return user;
}

export function generateRandomBase32() {
  const buffer = crypto.getRandomValues(new Uint8Array(15));
  return base32.encode(buffer).replace(/=/g, "").substring(0, 24);
}

export function getTotp(secret: string) {
  return new OTPAuth.TOTP({
    issuer: "Whenplane",
    label: "Whenplane two-factor",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret
  });
}

export function getUrl(secret: string) {
  return getTotp(secret).toString()
}

export function validate2fa(secret: string, token: string, window = 1) {
  const totp = getTotp(secret);
  return totp.validate({token, window}) != null;
}

export type UserData = {
  username: string,
  email?: string,
  email_verified?: boolean,
  "2fa"?: string,
  created: number
}

export type SessionData = UserData & {sessionID: string}