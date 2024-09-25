<script lang="ts">

  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";

  export let before: string;
  export let after: string;

  $: parsedBefore = JSON.parse(before);
  $: parsedAfter = JSON.parse(after);

  $: if((parsedBefore === 1 && parsedAfter === 0) || (parsedBefore === 0 && parsedAfter === 1)) {
    parsedBefore = parsedBefore === 1;
    parsedAfter = parsedAfter === 1;
    diffType = "words"
  }

  export let displaying: "before" | "after";
  export let diffType: "chars" | "words" = "chars";

  let html: string;
  $: {
    html = "";
    let diff;
    switch(diffType) {
      case "words":
        diff = Diff.diffWords(parsedBefore+"", parsedAfter+"");
        break;
      case "chars":
      default:
        diff = Diff.diffChars(parsedBefore+"", parsedAfter+"");
    }
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

    if(diff.length === 0) { // if diff checking fails, just display the text
      html = escapeHtml("" + (displaying === "after" ? parsedAfter : parsedBefore));
    }

    html = html.replaceAll("&lt;br&gt;", "<br>");
  }
</script>
{@html html}
