<script lang="ts">
  import * as Diff from 'diff';
	import { escapeHtml } from '$lib/utils.ts';
	import { typed } from '$lib';

	let {
		before = typed<string>(),
		after = typed<string>(),
		displaying = typed<'before' | 'after'>(),
		diffType = $bindable<'chars' | 'words' | 'lines'>('chars')
	} = $props();

	let parsedBefore = $derived.by(() => {
    const b = JSON.parse(before);
    if(b === 0 || b === 1 || typeof b === "boolean") return b == 1;
    return b;
  });
	let parsedAfter = $derived.by(() => {
    const a = JSON.parse(after);
    if(a === 0 || a === 1 || typeof a === "boolean") return a == 1;
    return a;
  });

  let forcedDiffType: 'chars' | 'words' | 'lines' | undefined = $derived.by(() => {
    if(typeof parsedBefore === "boolean" && typeof parsedAfter === "boolean") return "words";
    return undefined;
  });

  let html: string = $derived.by(() => {
    let html = '';
    let diff;
    switch (forcedDiffType ?? diffType) {
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

    html = html.replaceAll('&lt;br&gt;', '<br>');
    return html;
  })

</script>

{@html html}
