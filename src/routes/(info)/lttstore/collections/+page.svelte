<script lang="ts">
  import DateStamp from "$lib/DateStamp.svelte";
  import { page } from "$app/stores";

  let { data } = $props();
</script>

<svelte:head>
  <title>LTTStore Collections - Whenplane</title>
  <meta name="description" content="This is a list of all the collections that are on lttstore. Click one to see more details."/>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Watcher</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Collections</li>
</ol>

<div class="p-2">
  <div class="limit mx-auto">
    <h1>LTTStore Collections</h1>
    This is a list of all the collections that are on lttstore. Click one to see more details.<br>
    <br>
  </div>
  <table class="mx-auto">
    <tbody>
      {#each data.collections as collection}
        {@const image = collection.image ? JSON.parse(collection.image) : collection.image}
        <tr>
          <td style="width: 5em;">
            <a href="/lttstore/collections/{collection.handle}" class="hidden-link">
              {#if image}
                <img src={image.src} alt={image.alt} style="width: 5em;" class="rounded-sm"/>
              {/if}
            </a>
          </td>
          <td class="px-1">
            <a href="/lttstore/collections/{collection.handle}" class="hidden-link">
              {collection.title}
            </a>
          </td>
          <td class="px-1">
            <a href="/lttstore/collections/{collection.handle}" class="hidden-link">
              <span class="opacity-60">
                Updated <DateStamp epochSeconds={collection.updated_at / 1e3}/>
              </span>
            </a>
          </td>
          <td class="px-1">
            <a href="/lttstore/collections/{collection.handle}" class="hidden-link">
              <span class="opacity-65">
                {collection.observedCount} / {collection.reportedCount} products
              </span>
            </a>
          </td>
        </tr>

        <br>
      {:else}
        <tr>
          <td>
            None.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>