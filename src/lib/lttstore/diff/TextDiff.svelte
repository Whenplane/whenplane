<script lang="ts" module>
  import { browser } from "$app/environment";
  import { wait } from "$lib/utils.ts";
  import DiffWorker from "./diffWorker.ts?worker"
  import wrapArrow from "$lib/svg/arrow-left-down.svg?url&no-inline"

  let diffWorker: Worker;
  let resolveFunctions: {[key: string]: (data: string) => void} = {};
  if(browser) {
    diffWorker = new DiffWorker();
    diffWorker.onmessage = (m: MessageEvent<{id: string, html: string}>) => {
      resolveFunctions[m.data.id]?.(m.data.html);
      delete resolveFunctions[m.data.id];
    }
  }

  async function diff(diffType: DiffType, parsedBefore: string, parsedAfter: string, displaying: 'before' | 'after', format: string | undefined) {
    let id: string;
    do {
      id = Date.now().toString(36) + "-" + crypto.randomUUID();
    } while(resolveFunctions[id] !== undefined);

    // If diffWorker isn't set up yet, wait for it
    while(typeof diffWorker?.onmessage === "undefined") {
      await wait(Math.floor(50 + (50 * Math.random())));
    }

    diffWorker.postMessage({ id, diffType, parsedBefore, parsedAfter, displaying, format });
    return new Promise<string>((resolve) => {
      resolveFunctions[id] = (result: string) => {
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
    card = typed<boolean>(true),
    format = typed<string | undefined>(),
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

  let chosenFormat = $derived.by(() => {
    if(format) return format;

  })

  let forcedDiffType: DiffType | undefined = $derived.by(() => {
    if(typeof parsedBefore === "boolean" && typeof parsedAfter === "boolean") return "words";
    return undefined;
  });

  let html: Promise<string> = $derived(
    diff(forcedDiffType ?? diffType as DiffType, parsedBefore, parsedAfter, displaying, chosenFormat)
  )

  let isChangeImage = $derived(page.url.pathname.includes("changeImage"));
</script>

<div
  class={[
    !isChangeImage && "whitespace-pre",
    isChangeImage && "whitespace-pre-wrap",
    card && "card p-2 max-w-full",
    card && !isChangeImage && "overflow-x-auto",
    card && isChangeImage && "text-wrap! overflow-x-hidden"
  ]}
  style={card && isChangeImage ? `--wrap-icon: url(${wrapArrow})` : undefined}
>
  {#if page.url.pathname.includes("changeImage")}
    {@const h = calcDiff(forcedDiffType ?? diffType as DiffType, parsedBefore, parsedAfter, displaying, chosenFormat)}
    {#each h.split(/\n|<br\s*\/?>/i).filter(line => line.trim() !== "") as line}
      <div class="wrap-icon">{@html line}</div>
    {/each}
  {:else}
    {#await html}
      <span class="placeholder animate-pulse w-32 inline-block"></span>
    {:then h}
      {@html h}
    {/await}
  {/if}
</div>
<style>
    @reference "#app.css";

    .wrap-icon {
        --lh: 1.5em;
        position: relative;
        overflow: hidden;        /* clips the icon on non-wrapped lines */
        padding-left: var(--lh);
        text-indent: calc(-1 * var(--lh));     /* pulls first line back to the left edge */
        line-height: var(--lh);
    }
    .wrap-icon::before {
        content: "";
        position: absolute;
        top: var(--lh);
        bottom: 0;
        left: 0;
        width: var(--lh);
        background-color: currentColor;
        opacity: 0.25;
        mask: var(--wrap-icon) repeat-y top / var(--lh) var(--lh);
        -webkit-mask: var(--wrap-icon) repeat-y top / var(--lh) var(--lh);
    }
    /*.wrap-icon {
        padding-left: 1.5em;
        text-indent: -1.5em;
        background: var(--wrap-icon) no-repeat 0 1.6em;
    }*/
</style>
