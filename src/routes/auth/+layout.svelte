<script lang="ts">
  import { page } from "$app/stores";
  import { routeNames } from "./routeNames.ts";
  import { capitalize } from "$lib/utils";

  let pathHierarchy: string[] = []
  $: {
    pathHierarchy = $page.url.pathname.split("/");
    if(pathHierarchy[0] === "") pathHierarchy.shift();
  }
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
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
<slot/>