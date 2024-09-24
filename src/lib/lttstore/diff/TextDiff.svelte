<script lang="ts">

  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";

  export let before: string;
  export let after: string;

  $: parsedBefore = JSON.parse(before) as string;
  $: parsedAfter = JSON.parse(after) as string;

  export let displaying: "before" | "after";

  let html: string;
  $: {
    html = "";
    const diff = Diff.diffChars(parsedBefore, parsedAfter);
    diff.forEach(part => {
      const color = part.added ? 'green' :
        part.removed ? 'red' : false;

      const text = escapeHtml(part.value)

      if(!color) {
        html += text;
      } else {
        if((color === 'green' && displaying === "after") || (color === 'red' && displaying === "before")) {
          html += "<span style='color:" + color + "'>" + text + "</span>";
        } else {
          html += "<span style='background-color:" + color + "' class='opacity-40'>&ThinSpace;</span>";
        }
      }
    })
  }
</script>
{@html html}
