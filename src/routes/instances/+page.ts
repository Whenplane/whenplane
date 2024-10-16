import type { PageLoad } from "./$types";
import type { WorkerInstance } from "./types.ts";


let lastInactiveFetch = 0;
let lastInactive: WorkerInstance[];
let lastInactiveInstanceColos: {[colo: string]: number};

export const load = (async ({fetch}) => {

  const activeInstances: WorkerInstance[] = await fetch("https://cf-instance-analytics.ajg0702.us/activeInstances?d=" + Date.now())
    .then(r => r.json())

  let inactiveInstances: WorkerInstance[] = [];
  let inactiveInstanceColos: {[colo: string]: number} = {};
  if(Date.now() - lastInactiveFetch < 30e3) {
    inactiveInstances = lastInactive;
    inactiveInstanceColos = lastInactiveInstanceColos;
  } else {
    lastInactiveFetch = Date.now();
    lastInactive = await fetch("https://cf-instance-analytics.ajg0702.us/inactiveInstances?d=" + Date.now())
      .then(r => r.json());
    inactiveInstances = lastInactive;

    for (const instance of lastInactive) {
      const old = inactiveInstanceColos[instance.colo] ?? 0;
      inactiveInstanceColos[instance.colo] = old + 1;
    }
    lastInactiveInstanceColos = inactiveInstanceColos;
  }

  const activeInstanceColos: {[colo: string]: number} = {};
  const longestActiveColos: {[colo: string]: number} = {};

  for (const instance of activeInstances) {
    const old = activeInstanceColos[instance.colo] ?? 0;
    activeInstanceColos[instance.colo] = old + 1;

    const oldFirstSeen = longestActiveColos[instance.colo] ?? Number.MAX_SAFE_INTEGER;
    if(oldFirstSeen > instance.firstSeen) longestActiveColos[instance.colo] = instance.firstSeen;
  }

  return {
    activeInstances,
    activeInstanceColos,
    longestActiveColos,
    inactiveInstances,
    inactiveInstanceColos
  };

}) satisfies PageLoad;