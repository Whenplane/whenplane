import { wait } from "$lib/utils.ts";

export async function getClockOffset(maxSamples = 5) {
  const offsets = [];

  for (let i = 0; offsets.length < maxSamples && i < (maxSamples*2); i++) {
    const t0 = Date.now();
    const res = await fetch('https://whenplane.com/_app/version.json', {
      // if this is used, then options requests are sent for every request on alt domains, increasing latency
      // it also reduces latency slightly (at least on ff) by using 304 not modified responses
      // cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const t1 = Date.now();

    const dateHeader = res.headers.get('Date');
    const timeHeader = res.headers.get("x-time-ms");
    if (!dateHeader && !timeHeader) continue;

    const serverTimeMs = timeHeader ? Number(timeHeader) : Date.parse(dateHeader!);
    const roundTrip = t1 - t0;
    const offset = serverTimeMs - (t0 + roundTrip / 2);

    // Reject samples with excessive RTT
    if (roundTrip < 5000) offsets.push(offset);

    // Delayed requests to measure over more time instead of one-after-the-other
    await wait(500);
  }

  if (offsets.length === 0) return null;

  // Use the median — more robust to outliers than the mean.
  offsets.sort((a, b) => a - b);
  return offsets[Math.floor(offsets.length / 2)];
}