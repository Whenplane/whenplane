<script lang="ts">
  import sanitizeHtml from "sanitize-html";
  import { page } from "$app/stores";
  import { countTo, truncateText } from "$lib/utils.ts";
  import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
  import { getFieldName } from "$lib/lttstore/field_names.ts";
  import { getDiffComponent } from "$lib/lttstore/field_components.ts";
  import DateStamp from "$lib/DateStamp.svelte";

  export let data;

  $: products = JSON.parse(data.collection.products);
  $: image = data.collection.image ? JSON.parse(data.collection.image) : data.collection.image

  let hideUpdated = true;
</script>

<svelte:head>
  <title>{data.collection.title} - Whenplane</title>
  {#if data.collection.description}
    <meta name="description" content={truncateText(sanitizeHtml(data.collection.description, {allowedTags: []}), 200)}/>
  {/if}
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore">LTT Store Watcher</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/collections">Collections</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">{data.collection.title}</li>
</ol>

{#if image}
  <div class="thumbnail-backdrop" aria-hidden="true">
    <img src={image.src} alt={image.alt}/>
  </div>
{/if}

<div class="p-2 limit mx-auto">
  <h1>{data.collection.title}</h1>
  {@html sanitizeHtml(data.collection.description ?? "")}
  <br>
  <a href="https://www.lttstore.com/collections/{data.collection.handle}">View on LTTStore</a><br>
  <br>
  This collection has {data.collection.reportedCount} product{data.collection.reportedCount === 1 ? "" : "s"} in it{data.collection.reportedCount === products.length ? "." : ","}
  {#if data.collection.reportedCount !== products.length}
    but only {products.length} are currently published.
  {/if}
  <br>
  <br>
  <Accordion>
    <AccordionItem>
      <svelte:fragment slot="summary">Products</svelte:fragment>
      <svelte:fragment slot="content">
        <div class="accordion-outline p-2">
          {#if data.collection.reportedCount !== products.length}
            <small>
              Note: These are only the products that are published.
              We are not able to see the unpublished products in this collection,
              we only know that there are {data.collection.reportedCount - products.length} of them.
            </small>
          {/if}
          <div>
            {#each products as product}
              <a href="/lttstore/products/{product.handle}">{product.title}</a><br>
            {/each}
          </div>
        </div>

      </svelte:fragment>
    </AccordionItem>
  </Accordion>
  <br>
  <br>
  <h2>Changes</h2>
  <label>
    <input class="checkbox" type="checkbox" bind:checked={hideUpdated}/>
    <span>
      Hide "Updated Timestamp" changes?
    </span>
  </label>
</div>
<div class="p-2">
  {#await data.changes}
    <div class="table-container rounded-md">
      <table class="table table-hover rounded-md">
        <thead>
        <tr>
          <th>What changed</th>
          <td>Change seen</td>
          <th>Before</th>
          <th>After</th>
        </tr>
        </thead>
        <tbody>
        {#each countTo(20) as change}
          <tr>
            <td><div class="placeholder animate-pulse w-32"></div></td>
            <td><div class="placeholder animate-pulse w-16"></div></td>
            <td><div class="placeholder animate-pulse w-64"></div></td>
            <td><div class="placeholder animate-pulse w-64"></div></td>
          </tr>
        {/each}
        </tbody>
        {#if false}
          <tfoot>
          <tr style="text-transform: initial !important;">
            <td class="!p-2 opacity-70" colspan="3">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
          </tr>
          </tfoot>
        {/if}
      </table>
    </div>
  {:then changeHistory}
    <div class="table-container rounded-md">
      <table class="table table-hover rounded-md">
        <thead>
        <tr>
          <th>What changed</th>
          <td>Change seen</td>
          <th>Before</th>
          <th>After</th>
        </tr>
        </thead>
        <tbody>
        {#each hideUpdated ? changeHistory.filter(c => c.field !== "updated_at") : changeHistory as change (change.timestamp+"."+change.field)}
          {@const field = "collection-" + change.field}
          <tr>
            <td>{getFieldName(field)}</td>
            <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
            <td><svelte:component this={getDiffComponent(field)} before={change.old} after={change.new} displaying="before"/></td>
            <td><svelte:component this={getDiffComponent(field)} before={change.old} after={change.new} displaying="after"/></td>
          </tr>
        {/each}
        </tbody>
        {#if false}
          <tfoot>
          <tr style="text-transform: initial !important;">
            <td class="!p-2 opacity-70" colspan="3">Changes before <DateStamp epochSeconds={1727147700}/> are not available</td>
          </tr>
          </tfoot>
        {/if}
      </table>
    </div>
  {/await}
</div>

<style>
  .accordion-outline {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-top: none;
      border-radius: 0 0 12px 12px;
  }

  .thumbnail-backdrop {
      position: absolute;
      top: 0;
      z-index: -1;
      mask: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0));
      height: 35vw;
      overflow-y: hidden;
  }

  .thumbnail-backdrop > img {
      opacity: 15%;
      width: 100vw;
      height: auto;
      object-fit: cover;
  }
</style>