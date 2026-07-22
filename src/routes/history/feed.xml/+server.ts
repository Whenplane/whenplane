import { type RequestHandler, text } from "@sveltejs/kit";
import { Feed } from "feed";
import { type HistoricalEntry, truncateText } from "$lib/utils.ts";
import {
  getClosestWan,
  getNextWAN,
  getNextWANLuxon,
  getTimeUntil,
  getUTCDate,
  isWrongOffset,
  timeString
} from "$lib/timeUtils.ts";
import { version } from "$app/environment";
import type { AlternateTimeRow } from "../../api/alternateStartTimes/+server.ts";

export const GET = (async ({fetch}) => {

  const now = new Date();

  let cacheBusting;
  if((now.getUTCDay() === 5 && now.getUTCHours() > 19) || (now.getUTCDay() === 6 && now.getUTCHours() < 10)) {
    cacheBusting = "?d=" + now.getTime();
  } else {
    cacheBusting = "";
  }

  const feed = new Feed({
    title: "Whenplane WAN Shows",
    description: "Recent WAN Shows tracked by Whenplane",
    id: "https://whenplane.com/history",
    link: "https://whenplane.com/history",
    language: "en",
    image: "https://whenplane.com/wan-ios-logo.png",
    favicon: "https://whenplane.com/wan-ios-logo.png",
    generator: "Whenplane",
    feed: "https://whenplane.com/history/feed.xml",
    ttl: 12 * 60 * 60 // 12 hours
  });

  const currentYear = now.getUTCFullYear();
  const years = [];

  years.push(currentYear);
  if(now.getMonth() < 4) {
    years.push(currentYear - 1); // only fetch previous year if we are less than 4 months into a new year
  }

  const shows: HistoricalEntry[] = await fetch("/api/history/year/" + years.join(",") + cacheBusting)
    .then(r => r.json());

  const alternateStartTimes = await fetch("/api/alternateStartTimes?v=" + version)
    .then(r => r.json() as Promise<AlternateTimeRow[]>);

  let latestShow: string | undefined = undefined;

  for (let show of shows) {
    if(!show.metadata.title) continue; // don't add shows unless we have a title (shows might not have a title before the Youtube live page is published)
    if(!show.metadata.preShowStart && !show.metadata.mainShowStart) continue; // shouldn't happen but better to be safe

    if(!latestShow) latestShow = show.name;

    const published = new Date(show.metadata.preShowStart || show.metadata.mainShowStart || show.name);
    const showDate = getClosestWan(new Date(show.metadata.preShowStart ?? show.metadata.mainShowStart ?? show.metadata.showEnd ?? show.metadata.snippet?.publishedAt ?? show.name), alternateStartTimes);
    const onTimeUntil = show.metadata.mainShowStart && getTimeUntil(showDate, new Date(show.metadata.mainShowStart).getTime());
    const onTimeString = onTimeUntil && (onTimeUntil.distance < 5 * 60e3 ? "on time!" : (onTimeUntil.late ? onTimeUntil.string + "late" : onTimeUntil.string + "early!"))

    const mainShowStart = (show.metadata.mainShowStart && new Date(show.metadata.mainShowStart)) || undefined;
    const showEnd = (show.metadata.showEnd && new Date(show.metadata.showEnd)) || undefined

    const thumbnails = show.metadata.thumbnails ?? show.metadata.snippet?.thumbnails;
    const thumbnail = thumbnails?.maxres ?? thumbnails?.standard ?? thumbnails?.high ?? thumbnails?.medium ?? thumbnails?.default;
    if(thumbnail) delete thumbnail.blurhash;

    feed.addItem({
      title: `${show.metadata.title ?? show.metadata.snippet?.title}`,
      id: `show/${show.name}`,
      link: `https://whenplane.com/history/show/${show.name}`,
      guid: `https://whenplane.com/history/show/${show.name}`,
      published,
      date: published,
      description: "WAN show from " + published.toLocaleDateString(undefined, {dateStyle: 'long', timeZone: "Etc/GMT+7"}) +
        (show.metadata.title ? " titled '" + truncateText(show.metadata.title.trim(), 65) + "'" : "") + ". " +
        (onTimeString ? 'It was ' + onTimeString.trim() : '') +
        ((mainShowStart instanceof Date && showEnd instanceof Date) || show.metadata.mainShowLength
          ? (onTimeString ? ", and" : "It") +
            " was live for " +
            timeString(
              show.metadata.mainShowLength ??
              (showEnd && mainShowStart && (showEnd?.getTime() - mainShowStart?.getTime()))
            )?.trim() + "."
          : "."
        ),
      image: thumbnail,

    })
  }

  let hasNext = latestShow === getUTCDate(getNextWAN(now, true, alternateStartTimes, false));
  // set caches to expire 4 hours after the next scheduled wan start time
  let nextWAN = getNextWANLuxon(now, true, alternateStartTimes, hasNext);
  hasNext = latestShow === getUTCDate(nextWAN.toJSDate());
  nextWAN = nextWAN.plus({hour: 4})

  // uses 12h instead of calculating time if our response has the show that we're thinking is the latest
  // also doesn't let max-age be lower than 30m
  const cacheSeconds = !hasNext
    ? Math.max(
      Math.floor((nextWAN.toMillis() - Date.now()) / 1e3),
      30 * 60
    )
    : (12 * 60 * 60);

  // don't let feed's ttl be bigger than 24h, because it gets cached by Cloudflare
  feed.options.ttl = Math.min(24 * 60 * 60, cacheSeconds);


  return text(feed.rss2(), {
    headers: {
      "content-type": "application/rss+xml",
      "cache-control": `public, max-age=${cacheSeconds}`,
    }
  })

}) satisfies RequestHandler