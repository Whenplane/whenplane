import type { DiffType } from "$lib/lttstore/diff/TextDiff.svelte";
import { escapeHtml } from "$lib/utils.ts";
import * as Diff from 'diff';

addEventListener("message", (e: MessageEvent<{id: string, diffType: DiffType, parsedBefore: string, parsedAfter: string, displaying: 'before' | 'after'}>) => {
  const {diffType, parsedBefore, parsedAfter, displaying} = e.data;


  let html = '';
  let diff;
  switch (diffType) {
    case 'lines':
      diff = Diff.diffLines(parsedBefore + '', parsedAfter + '');
      break;
    case 'words':
      diff = Diff.diffWords(parsedBefore + '', parsedAfter + '', { ignoreWhitespace: true });
      break;
    case 'chars':
    default:
      diff = Diff.diffChars(parsedBefore + '', parsedAfter + '');
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

  html = html
    .replaceAll('&lt;br&gt;', "&lt;br&gt;\n")
    .replaceAll("\n", '<br>')
  ;
  console.debug("Returning diff html", html)
  postMessage({id: e.data.id, html})
})