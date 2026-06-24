<script lang="ts" module>
  import { browser } from "$app/environment";
  import { wait } from "$lib/utils.ts";
  import DiffWorker from "./diffWorker.ts?worker"

  let diffWorker: Worker;
  let resolveFunctions: {[key: string]: (data: string) => void} = {};
  if(browser) {
    diffWorker = new DiffWorker();
    diffWorker.onmessage = (m: MessageEvent<{id: string, html: string}>) => {
      resolveFunctions[m.data.id]?.(m.data.html);
      delete resolveFunctions[m.data.id];
    }
  }

  async function diff(diffType: DiffType, parsedBefore: string, parsedAfter: string, displaying: 'before' | 'after') {
    let id: string;
    do {
      id = Date.now().toString(36) + "-" + crypto.randomUUID();
    } while(resolveFunctions[id] !== undefined);

    // If diffWorker isn't set up yet, wait for it
    while(typeof diffWorker?.onmessage === "undefined") {
      await wait(Math.floor(50 + (50 * Math.random())));
    }

    diffWorker.postMessage({ id, diffType, parsedBefore, parsedAfter, displaying });
    return new Promise<string>((resolve) => {
      resolveFunctions[id] = (result: string) => {
        console.log("Got diff result:", result);
        resolve(result)
      };
    })
  }

  export type DiffType = 'chars' | 'words' | 'lines';
</script>
<script lang="ts">
	import { typed } from '$lib';
  import { page } from "$app/state";
  import { calcDiff } from "$lib/lttstore/diff/diffWork.ts";

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>(),
		diffType = $bindable<DiffType>('chars'),
    card = typed<boolean>(true)
	} = $props();

	let parsedBefore = $derived.by(() => {
    try {
      const b = JSON.parse(before);
      if(b === 0 || b === 1 || typeof b === "boolean") return b == 1;
      if(b+"" === "[object Object]") return before;
      return b;
    } catch(e) {
      console.debug("Throw in before: ", {before, after});
      throw e;
    }
  });
	let parsedAfter = $derived.by(() => {
    try {
      const a = JSON.parse(after);
      if(a === 0 || a === 1 || typeof a === "boolean") return a == 1;
      if(a+"" === "[object Object]") return after;
      return a;
    } catch(e) {
      console.debug("Throw in after: ", {after, before});
      throw e;
    }
  });

  let forcedDiffType: DiffType | undefined = $derived.by(() => {
    if(typeof parsedBefore === "boolean" && typeof parsedAfter === "boolean") return "words";
    return undefined;
  });

  let html: Promise<string> = $derived(
    diff(forcedDiffType ?? diffType as DiffType, parsedBefore, parsedAfter, displaying)
  )

</script>

<div class={card ? "card p-2 overflow-x-auto max-w-full" : ""}>
  {#if page.url.pathname.includes("changeImage")}
    {@html calcDiff(forcedDiffType ?? diffType as DiffType, parsedBefore, parsedAfter, displaying)}
  {:else}
    {#await html}
      <span class="placeholder animate-pulse w-32 inline-block"></span>
    {:then h}
      {@html h}
    {/await}
  {/if}
</div>
