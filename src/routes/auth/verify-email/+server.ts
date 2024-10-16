import { error, redirect, type RequestHandler } from "@sveltejs/kit";

export const GET = (async ({platform, url}) => {
  const verifyToken = url.searchParams.get("token");
  if(!verifyToken) {
    throw error(400, "Missing verification token");
  }

  const db = platform?.env?.AUTH;
  if(!db) throw error(500, "Missing auth db!");

  const kv = platform?.env?.AUTH_KV;
  if(!kv) throw error(500, "Missing auth kv!");

  const username = await kv.get("email:" + verifyToken);
  if(!username) {
    throw error(404, "Token is invalid or expired!");
  }

  // we have a valid token! Go ahead and verify.

  await db.prepare("update users set email_verified=1 where username = ?")
    .bind(username).run();

  throw redirect(302, "/auth/login?email-verified&username=" + encodeURIComponent(username));

}) satisfies RequestHandler