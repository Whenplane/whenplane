<script lang="ts">

  import * as Diff from "diff"
  import { escapeHtml } from "$lib/utils.ts";
  import type { ProductVariant } from "$lib/lttstore/lttstore_types.ts";
  import { getVariantFieldName } from "$lib/lttstore/field_names.ts";

  export let before: string;
  export let after: string;

  $: parsedBefore = JSON.parse(JSON.parse(before)) as {id: string, title: string, handle: string, image: string}[];
  $: parsedAfter = JSON.parse(JSON.parse(after)) as {id: string, title: string, handle: string, image: string}[];

  export let displaying: "before" | "after";

  let html: string;
  $: {
    html = "";
    const beforeTitles = parsedBefore.map(p => p.title)
    let removed: string[] = [];
    const added = parsedAfter.filter(p => !beforeTitles.includes(p.title));
    console.debug({before, after, parsedBefore, parsedAfter});
    for (let addedProduct of added) {
      if(displaying === "before") {
        html += "<span style='background-color: rgba(0, 255, 0, 0.2)' class='opacity-40 pl-1'></span><br>";
      } else {
        html += "<a href='/lttstore/products/" + addedProduct.handle + "' class='hidden-link' style='background-color: rgba(0, 255, 0, 0.2)'>" +
          "Added " + addedProduct.title +
          "</a><br>";
      }
    }
    for (let i = 0; i < parsedBefore.length; i++) {
      const beforeProduct = parsedBefore[i];
      const afterProduct = parsedAfter.find(v => v.title === beforeProduct.title);
      for (let beforeEntry of Object.entries(beforeProduct)) {
        const key = beforeEntry[0];
        const beforeValue = beforeEntry[1];
        const afterValue = (afterProduct as {[key: string]: any})?.[key];
        if(["null", "undefined"].includes(typeof afterValue)) {
          if(!removed.includes(beforeProduct.title)) {
            if(displaying === "after") {
              html += "<a href='/lttstore/products/" + beforeProduct.handle + "' class='hidden-link' style='background-color: rgba(255, 0, 0, 0.2)'>" +
                "Removed " + beforeProduct.title +
                "</a><br>";
            } else {
              html += "<span style='background-color: rgba(255, 0, 0, 0.2)' class='opacity-40 pl-1'></span><br>"
            }
            removed.push(beforeProduct.title);
          }
        } else {
          if(JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
            if(typeof beforeValue === "object" || typeof afterValue === "object") {
              for (let beforeValueEntry of Object.entries(beforeValue ?? {})) {
                const subKey = beforeValueEntry[0];
                const beforeSubValue = beforeValueEntry[1];
                const afterSubValue = (afterValue as { [key: string]: any })?.[subKey];
                if(JSON.stringify(beforeSubValue) === JSON.stringify(afterSubValue)) continue;
                html += "<a href='/lttstore/products/" + beforeProduct.handle + "' class='hidden-link'>" + beforeProduct.title + "</a>: " + getVariantFieldName(key) + ": " + getVariantFieldName(subKey) + " " +
                  "<span style='background-color: rgba(" + (displaying == "before" ? "255, 0, 0" : "0, 255, 0") + ", 0.2)'>" +
                  (displaying == "before" ? beforeSubValue : afterSubValue) +
                  "</span><br>";
              }
            } else {
              html += "<a href='/lttstore/products/" + beforeProduct.handle + "' class='hidden-link'>" + beforeProduct.title + "</a>: " + getVariantFieldName(key) + ": " +
                "<span style='background-color: rgba(" + (displaying == "before" ? "255, 0, 0" : "0, 255, 0") + ", 0.2)'>" +
                (displaying == "before" ? beforeValue : afterValue) +
                "</span><br>";
            }
          }
        }
      }
    }

    html = html.replace(/\n/g, "<br>")
      .replace(/\t/g, "&emsp;");
  }
</script>
{@html html}
