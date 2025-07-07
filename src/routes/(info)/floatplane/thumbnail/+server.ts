export const GET = async ({fetch}) => {
  const thumbnail: string | undefined = await fetch("/api/floatplane?fast=false")
    .then(r => r.json())
    .then(r => r.thumbnail);

  if (!thumbnail) {
    return new Response("No thumbnail available", { status: 404 });
  }

  const response = await fetch(thumbnail);
  return new Response(response.body, {
    headers: response.headers
  });
}