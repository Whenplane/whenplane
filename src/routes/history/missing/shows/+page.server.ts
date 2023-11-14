import {load as l} from "../times/+page.server.ts";
import type { PageServerLoad } from "./$types";
import { getUTCDate } from "$lib/timeUtils.ts";

export const load = (async () => {
  const { oldShows } = await l();

  const missing: string[] = [];

  for (let i = 0; i < oldShows.length; i++) {
    const thisShow = oldShows[i];
    const nextShow = oldShows[i+1];

    if(!nextShow || !thisShow) continue;

    const thisShowDate = new Date(thisShow.name);
    const nextShowDate = new Date(nextShow.name);


    const distance = thisShowDate.getTime() - nextShowDate.getTime();

    // If the next show is more than 10 days apart, either they missed a show or we are missing that show
    if(distance > 10 * 24 * 60 * 60e3) {

      console.log((distance / (24 * 60 * 60e3)) + " days");

      const theoreticalNextShow = new Date(thisShowDate);
      theoreticalNextShow.setDate(thisShowDate.getDate() - 7);

      while(nextShowDate.getTime() < theoreticalNextShow.getTime()) {
        console.log(getUTCDate(theoreticalNextShow));
        missing.push(getUTCDate(theoreticalNextShow));

        theoreticalNextShow.setDate(theoreticalNextShow.getDate() - 7);
      }
    }
  }

  return {missing}

}) satisfies PageServerLoad;