import type { DiffType } from "$lib/lttstore/diff/TextDiff.svelte";
import { calcDiff } from "$lib/lttstore/diff/diffWork.ts";

type MessageFormat = {
  id: string,
  diffType: DiffType,
  parsedBefore: string,
  parsedAfter: string,
  displaying: 'before' | 'after',
  format: string | undefined
}

addEventListener("message", async (e: MessageEvent<MessageFormat>) => {
  const {diffType, parsedBefore, parsedAfter, displaying, format} = e.data;

  const html = calcDiff(diffType, parsedBefore, parsedAfter, displaying, format);

  postMessage({id: e.data.id, html})
})