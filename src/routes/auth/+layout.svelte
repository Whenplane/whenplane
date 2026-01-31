<script lang="ts">
  import { run } from 'svelte/legacy';

  import { page } from "$app/state";
  import { routeNames } from "./routeNames.ts";
  import { capitalize } from "$lib/utils";
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  let pathHierarchy: string[] = $state([])
  run(() => {
    pathHierarchy = page.url.pathname.split("/");
    if(pathHierarchy[0] === "") pathHierarchy.shift();
  });
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  {#each pathHierarchy as path, i}
    {@const fullPath = "/" + pathHierarchy.slice(0, i+1).join("/")}
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    {#if i >= pathHierarchy.length-1}
      <li class="crumb">{routeNames[fullPath] ?? capitalize(path)}</li>
    {:else}
      <li class="crumb"><a class="anchor hover-underline" href={fullPath}>{routeNames[fullPath] ?? capitalize(path)}</a></li>
    {/if}
  {/each}
</ol>
{@render children?.()}