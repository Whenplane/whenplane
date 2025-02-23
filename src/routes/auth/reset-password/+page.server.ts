import { env } from "$env/dynamic/private";
import { type Actions, fail, redirect } from "@sveltejs/kit";
import * as bcrypt from "bcryptjs";
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

const simpleRateLimit: {[ip: string]: number[]} = {}

export const load = (async ({url}) => {
  if(!url.searchParams.has("token")) throw redirect(302, "/auth/login/forgot-password");
  const expiration = url.searchParams.get("expiration");
  if(expiration && Date.now() > Number(expiration)) {
    throw redirect(302, "/auth/login/forgot-password?expiredToken");
  }
});

export const actions = {
  default: async ({platform, request, getClientAddress, url}) => {
    const data = await request.formData();
    const firstPassword = data.get("firstPassword") as string;
    const secondPassword = data.get("secondPassword") as string;

    const resetToken = url.searchParams.get("token");

    if(!firstPassword || !secondPassword) {
      return fail(400, {missing: true});
    }

    if(firstPassword !== secondPassword) {
      return fail(400, {passwordsDontMatch: true})
    }
    const password = firstPassword; // we know they are the same, so just pick the first one.

    if(password.length < 10 || password.length > 128) {
      return fail(400, {passwordLength: true})
    }

    // All the simple checks passed. Let's start rate limiting now.


    let limits = simpleRateLimit[getClientAddress()] ?? [];
    // remove any requests older than 5 minutes (which will probably never happen but better to be safe)
    limits = limits.filter(t => t > (Date.now() - (5 * 60e3)));

    if(limits.length > 3) {
      return fail(429, {ratelimited: true})
    }
    limits.push(Date.now());
    simpleRateLimit[getClientAddress()] = limits;

    // Let's verify the turnstile

    const token = data.get("cf-turnstile-response");
    if(!token) return fail(400, {message: "Invalid turnstile response!"})
    const ip = request.headers.get('CF-Connecting-IP') || getClientAddress();
    if(!env.TURNSTILE_SECRET) return fail(503, {message: "Invalid turnstile secret!"})

    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const turnstileResponse: {success: boolean, "error-codes"?: string[]} = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData
      }
    ).then(r => r.json());

    console.debug({turnstileResponse})

    if(!turnstileResponse.success) {
      return fail(400, {message: "Failed turnstile! Errors: " + turnstileResponse["error-codes"]});
    }

    // turnstile passed!

    const db: D1Database | undefined = platform?.env?.AUTH;
    if(!db) return fail(500, {message: "Missing auth db!"});

    const kv: KVNamespace | undefined = platform?.env?.AUTH_KV;
    if(!kv) return fail(500, {message: "Missing auth kv!"});

    const email = await kv.get("password-reset:" + resetToken);
    if(email == null) throw redirect(302, "/auth/login/forgot-password?expiredToken");

    const passwordHash = await bcrypt.hash(password, 13);

    await db.prepare("update users set password = ? where email = ?")
      .bind(passwordHash, email)
      .run();

    throw redirect(302, "/auth/login?passwordResetSuccess")
  }
} satisfies Actions