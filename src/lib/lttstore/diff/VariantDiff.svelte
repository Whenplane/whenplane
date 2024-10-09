<script lang="ts">

  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";
  import type { ProductVariant } from "$lib/lttstore/lttstore_types.ts";
  import { getVariantFieldName } from "$lib/lttstore/field_names.ts";

  export let before: string;
  export let after: string;

  $: parsedBefore = JSON.parse(before) as ProductVariant[];
  $: parsedAfter = JSON.parse(after) as ProductVariant[];

  export let displaying: "before" | "after";

  let html: string;
  $: {
    html = "";
    let removed: string[] = [];
    for (let i = 0; i < parsedBefore.length; i++) {
      const beforeVariant = parsedBefore[i];
      const afterVariant = parsedAfter[i];
      for (let beforeEntry of Object.entries(beforeVariant)) {
        const key = beforeEntry[0];
        const beforeValue = beforeEntry[1];
        const afterValue = (afterVariant as {[key: string]: any})?.[key];
        if(displaying === "after" && ["null", "undefined"].includes(typeof afterValue)) {
          if(!removed.includes(beforeVariant.title)) {
            html += "<span style='background-color: rgba(255, 0, 0, 0.2)'>" +
              "Removed " + beforeVariant.title +
              "</span><br>";
            removed.push(beforeVariant.title);
          }
        } else {
          if(JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
            html += beforeVariant.title + ": " + getVariantFieldName(key) + ": " +
              "<span style='background-color: rgba(" + (displaying == "before" ? "255, 0, 0" : "0, 255, 0") + ", 0.2)'>" +
              (displaying == "before" ? beforeValue : afterValue) +
              "</span><br>";
          }
        }
      }
    }

    html = html.replace(/\n/g, "<br>")
      .replace(/\t/g, "&emsp;");
  }
</script>
{@html html}
