import type { LayoutServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";

export const load: LayoutServerLoad = async ({platform, params, url, fetch}) => {
  const youtubeToDate = platform?.env?.YOUTUBE_TO_DATE;
  if(params.showDate && !params.showDate.includes("/") && youtubeToDate) {
    const date = await youtubeToDate.get(params.showDate);
    if(date) {
      throw redirect(301, "/history/show/" + date + (url.searchParams.get("hash") ?? ""));
    }
  }

  const showResponsePromise = fetch(
    "/api/history/show/" + params.showDate,
    {
      headers: {
        "Accept": "application/json"
      }
    }
  );

  const showResponse = await showResponsePromise;

  const data = await showResponse.json() as HistoricalEntry & {message?: string};

  if(showResponse.status != 200) {
    throw error(showResponse.status, data.message || showResponse.statusText);
  }

  return data;
};