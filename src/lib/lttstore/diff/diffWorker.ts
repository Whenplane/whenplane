import type { DiffType } from "$lib/lttstore/diff/TextDiff.svelte";
import { calcDiff } from "$lib/lttstore/diff/diffWork.ts";

addEventListener("message", (e: MessageEvent<{id: string, diffType: DiffType, parsedBefore: string, parsedAfter: string, displaying: 'before' | 'after'}>) => {
  const {diffType, parsedBefore, parsedAfter, displaying} = e.data;

  const html = calcDiff(diffType, parsedBefore, parsedAfter, displaying);

  postMessage({id: e.data.id, html})
})