import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { AnalyticsEngineDataset } from "@cloudflare/workers-types";


export const GET = (async ({platform}) => {

  const record: AnalyticsEngineDataset = platform?.env?.TEST_WS_ANALYTICS;

  if(!record) throw error(503, "Missing analytics engine");

  record.writeDataPoint({
    doubles: [0]
  });

  return json({success: true});

}) satisfies RequestHandler;