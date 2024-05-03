import type { PageLoad } from "./$types";
import type { WorkerInstance } from "./types.ts";


let lastInactiveFetch = 0;
let lastInactive: WorkerInstance[];

export const load = (async ({fetch}) => {

  const activeInstances: WorkerInstance[] = await fetch("https://cf-instance-analytics.ajg0702.us/activeInstances?d=" + Date.now())
    .then(r => r.json())

  let inactiveInstances: WorkerInstance[] = [];
  if(Date.now() - lastInactiveFetch < 30e3) {
    inactiveInstances = lastInactive;
  } else {
    lastInactiveFetch = Date.now();
    lastInactive = await fetch("https://cf-instance-analytics.ajg0702.us/inactiveInstances?d=" + Date.now())
      .then(r => r.json());
  }

  const activeInstanceColos: {[colo: string]: number} = {};

  for (const instance of activeInstances) {
    const old = activeInstanceColos[instance.colo] ?? 0;
    activeInstanceColos[instance.colo] = old + 1;
  }

  return {
    activeInstances,
    activeInstanceColos,
    inactiveInstances
  };

}) satisfies PageLoad;