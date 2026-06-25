import type { DiffType } from "$lib/lttstore/diff/TextDiff.svelte";
import { escapeHtml } from "$lib/utils.ts";
import * as Diff from 'diff';
import { formatHtmlForDiff } from "$lib/lttstore/diff/htmlFormatter.ts";

export function calcDiff(diffType: DiffType, parsedBefore: string, parsedAfter: string, displaying: 'before' | 'after', format: string | undefined) {
  let html = '';
  let diff;
  parsedBefore = parsedBefore + '';
  parsedAfter = parsedAfter + '';
  if(format === "html") {
    parsedBefore = formatHtmlForDiff(parsedBefore);
    parsedAfter = formatHtmlForDiff(parsedAfter);
  }
  switch (diffType) {
    case 'lines':
      diff = Diff.diffLines(parsedBefore, parsedAfter);
      break;
    case 'words':
      diff = Diff.diffWords(parsedBefore, parsedAfter, { ignoreWhitespace: true });
      break;
    case 'chars':
    default:
      diff = Diff.diffChars(parsedBefore, parsedAfter);
  }
  diff.forEach((part) => {
    const color = part.added ? 'green' : part.removed ? 'red' : false;

    const text = escapeHtml(part.value);

    if (!color) {
      html += text;
    } else {
      if (
        (color === 'green' && displaying === 'after') ||
        (color === 'red' && displaying === 'before')
      ) {
        html += "<span style='color:" + color + "'>" + text + '</span>';
      } else {
        html += "<span style='background-color:" + color + "' class='opacity-40 pl-1'></span>";
      }
    }
  });

  if (diff.length === 0) {
    // if diff checking fails, just display the text
    console.debug('Diff did not return anything! Falling back to displaying text');
    html = escapeHtml(
      '' +
      (displaying === 'after'
        ? typeof parsedAfter === 'string'
          ? parsedAfter
          : JSON.stringify(parsedAfter)
        : typeof parsedBefore === 'string'
          ? parsedBefore
          : JSON.stringify(parsedBefore))
    );
  }

  return html;
}