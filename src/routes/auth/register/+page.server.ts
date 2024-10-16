import { env } from "$env/dynamic/private";
import { type Actions, fail, redirect } from "@sveltejs/kit";
import { sendEmail, VERIFICATION_EMAIL } from "$lib/server/email.ts";
import { EMAIL_ENDPOINT, EMAIL_PORT, EMAIL_PROXY_KEY, EMAIL_SERVER, EMAIL_USERNAME, EMAIL_PASSWORD } from "$env/static/private";
import { escapeHtml } from "$lib/utils.ts";
import { dev } from "$app/environment";
import * as bcrypt from "bcryptjs";
import { log } from "$lib/server/server-utils.ts";

const simpleRateLimit: {[ip: string]: number[]} = {}

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const restrictedEmailDomains = [
  "linusmediagroup.com",
  "floatplanemedia.com",
  "floatplane.com",
  "lmg.gg",
  "lttstore.com"
];

const restrictedEmails = [
  "lttwanshow@gmail.com",
  "lttwanshow2@gmail.com"
]

export const actions = {
  default: async ({platform, request, getClientAddress}) => {
    const data = await request.formData();
    const email = (data.get("email") as string)?.toLowerCase();
    const username = data.get("username") as string;
    const firstPassword = data.get("firstPassword") as string;
    const secondPassword = data.get("secondPassword") as string;

    if(!email || !username || !firstPassword || !secondPassword) {
      return fail(400, {username, missing: true})
    }

    if(firstPassword !== secondPassword) {
      return fail(400, {email, username, passwordsDontMatch: true})
    }
    const password = firstPassword; // we know they are the same, so just pick the first one.

    if(username.length < 3 || username.length > 16) {
      return fail(400, {email, username, usernameLength: true})
    }

    if(password.length < 10 || password.length > 1024) {
      return fail(400, {email, username, passwordLength: true})
    }


    // All the simple checks passed. Let's start rate limiting now.


    let limits = simpleRateLimit[getClientAddress()] ?? [];
    // remove any requests older than 5 minutes (which will probably never happen but better to be safe)
    limits = limits.filter(t => t > (Date.now() - (5 * 60e3)));

    if(limits.length > 3) {
      return fail(429, {username, ratelimited: true})
    }
    limits.push(Date.now());
    simpleRateLimit[getClientAddress()] = limits;


    // rate limit passed!

    // Let's verify the turnstile

    const token = data.get("cf-turnstile-response");
    if(!token) return fail(400, {email, username, message: "Invalid turnstile response!"})
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


    if(!emailRegex.test(email)) {
      return fail(400, {email, invalidEmail: true})
    }


    let normalizedEmail = email.toLowerCase();
    if(normalizedEmail.includes("+")){
      normalizedEmail = normalizedEmail.substring(0, normalizedEmail.indexOf("+")) + normalizedEmail.substring(normalizedEmail.indexOf("@"));
    }

    // most email servers appear to ignore dots. Include that in normalization for restriction checks
    if(normalizedEmail.substring(0, normalizedEmail.indexOf("@")).includes(".")) {
      normalizedEmail = normalizedEmail.substring(0, normalizedEmail.indexOf("@")).replaceAll(".", "")
       + normalizedEmail.substring(normalizedEmail.indexOf("@"))
    }

    console.log({normalizedEmail})

    let isRestrictedEmail = false;
    for (const restrictedEmailDomain of restrictedEmailDomains) {
      if(normalizedEmail.includes(restrictedEmailDomain)) {
        isRestrictedEmail = true;
        break;
      }
    }
    if(!isRestrictedEmail) {
      for (const restrictedEmail of restrictedEmails) {
        if(normalizedEmail === restrictedEmail) {
          isRestrictedEmail = true;
          break;
        }
      }
    }

    if(isRestrictedEmail) {
      return fail(400, {email, username, restrictedEmail: true})
    }

    // email is allowed!

    const db = platform?.env?.AUTH;
    if(!db) return fail(500, {message: "Missing auth db!"});

    const kv = platform?.env?.AUTH_KV;
    if(!kv) return fail(500, {message: "Missing auth kv!"});

    if(dev) {
      await db.prepare("create table if not exists users (username text, email text, email_verified number, password text, '2fa' text, created number)")
        .run();
    }

    const usernameExists = await db.prepare("select username from users where username = ? COLLATE NOCASE")
      .bind(username)
      .all()
      .then(r => r.results.length > 0);

    if(usernameExists) {
      return fail(400, {username, existingUsername: true})
    }

    const emailExists = await db.prepare("select username from users where email = ?")
      .bind(email)
      .all()
      .then(r => r.results.length > 0);

    if(emailExists) {
      return fail(400, {username, existingEmail: true})
    }

    const passwordHash = await bcrypt.hash(password, 13);

    await db.prepare("insert into users (username, email, email_verified, password, created) values (?, ?, ?, ?, ?)")
      .bind(username, email, 0, passwordHash, Date.now())
      .run();

    const emailVerifyToken = randomString();

    await kv.put("email:" + emailVerifyToken, username, {expirationTtl: 20 * 60e3});

    // prevents re-sending of the email before the previous one has expired
    await kv.put("block-email:" + username, email, {expirationTtl: 19 * 60e3});

    log(platform, "Sending verification email to " + email);
    await sendEmail(EMAIL_ENDPOINT, {
      key: EMAIL_PROXY_KEY,

      host: EMAIL_SERVER,
      port: Number(EMAIL_PORT),

      username: EMAIL_USERNAME,
      password: EMAIL_PASSWORD,

      from: "Whenplane <bread@whenplane.com>",
      to: email,
      subject: "Verify your email for your Whenplane account",
      body: VERIFICATION_EMAIL
        .replaceAll("{VERIFICATION_LINK}", "https://whenplane.com/auth/verify-email?token=" + encodeURIComponent(emailVerifyToken))
        .replaceAll("{USERNAME}", escapeHtml(username))
    })

    throw redirect(302, "/auth/register/success");

  }
} satisfies Actions

function randomString() {
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Date.now().toString(36) + btoa(array).replaceAll("=", "");
}