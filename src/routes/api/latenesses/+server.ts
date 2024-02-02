import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

export const GET = (async ({platform}) => {

  const meta = platform?.env?.META;
  if(!meta) throw error(503, "Missing meta KV!");

  const averageLateness = meta.get("averageLateness", {type: 'json'}) as Promise<number>;
  const latenessStandardDeviation = meta.get("latenessStandardDeviation", {type: 'json'}) as Promise<number>;
  const medianLateness = meta.get("medianLateness", {type: 'json'}) as Promise<number>;

  const response: Latenesses = {
    averageLateness: await averageLateness,
    latenessStandardDeviation: await latenessStandardDeviation,
    medianLateness: await medianLateness
  }

  return json(response);

}) satisfies RequestHandler;

export type Latenesses = {
  averageLateness?: number,
  latenessStandardDeviation?: number,
  medianLateness?: number
}