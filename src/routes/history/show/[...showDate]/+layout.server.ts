import type { LayoutServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import { version } from "$app/environment";
import type { AlternateTimeRow } from "../../../api/alternateStartTimes/+server.ts";

export const load: LayoutServerLoad = async ({platform, params, url, fetch}) => {
  const youtubeToDate = platform?.env?.YOUTUBE_TO_DATE;
  if(params.showDate && !params.showDate.includes("/") && youtubeToDate) {
    const date = await youtubeToDate.get(params.showDate);
    const afterId = url.pathname.split(params.showDate)[1];
    if(date) {
      const searchParams = url.searchParams.size > 0 ? "?" + url.searchParams : ""
      console.log({searchParams})
      throw redirect(301, "/history/show/" + date + afterId + searchParams + (url.searchParams.get("hash") ?? ""));
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

  const alternateStartTimes = await fetch("/api/alternateStartTimes?v=" + version)
    .then(r => r.json() as Promise<AlternateTimeRow[]>);

  return {
    ...data,
    alternateStartTimes
  };
};