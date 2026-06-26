<script lang="ts">
  import sanitizeHtml from "sanitize-html";
  import { page } from "$app/state";
  import { countTo, truncateText } from "$lib/utils.js";
  import { Accordion } from "@skeletonlabs/skeleton-svelte";
  import { getFieldName } from "$lib/lttstore/field_names.js";
  import { getDiffComponent } from "$lib/lttstore/field_components.js";
  import DateStamp from "$lib/DateStamp.svelte";
  import type {PageProps} from "./$types";
  import { Store } from "$lib/lttstore/lttstore_types.ts";
  import ChevronDown from "svelte-bootstrap-icons/lib/ChevronDown.svelte";
	import { slide } from "svelte/transition";
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";

  let { data }: PageProps = $props();

  let products = $derived(JSON.parse(data.collection.products));
  let image = $derived(data.collection.image ? JSON.parse(data.collection.image) : data.collection.image)

  let hideUpdated = $state(true);
</script>

<svelte:head>
  <title>{data.collection.title} Collection - Whenplane LTTStore Watcher</title>
  {#if data.collection.description}
    <meta name="description" content={truncateText(sanitizeHtml(data.collection.description, {allowedTags: []}), 200)}/>
  {/if}
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/{page.params.store}">LTT Store Watcher ({data.store.storeName})</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
  <li class="crumb"><a class="anchor hover-underline" href="/lttstore/{page.params.store}/collections">Collections</a></li>
  <li class="crumb-separator" aria-hidden="true">›</li>
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
  <a href="https://{data.store.subdomain}.lttstore.com/collections/{data.collection.handle}">View on LTTStore</a><br>
  <br>
  This collection has {data.collection.reportedCount} product{data.collection.reportedCount === 1 ? "" : "s"} in it{data.collection.reportedCount === products.length ? "." : ","}
  {#if data.collection.reportedCount !== products.length}
    but only {products.length} are currently published.
  {/if}
  <br>
  <br>
</div>
<div class="mx-auto p-2">
  <Accordion collapsible defaultValue={['1']}>
    <Accordion.Item value="1">
      <Accordion.ItemTrigger class="font-bold flex items-center justify-between gap-2 cool-border">
        Products
        <Accordion.ItemIndicator class="group">
          <ChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180 duration-400" />
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div transition:slide={{duration: 500}}>
              <div class="bordered-accordion-content p-2">
                {#if data.collection.reportedCount !== products.length}
                  <small class="block mb-2">
                    Note: These are only the products that are published.
                    We are not able to see the unpublished products in this collection,
                    we only know that there are {data.collection.reportedCount - products.length} of them.
                  </small>
                {/if}
                <div class="flex flex-wrap justify-center">
                  {#each products as product}
                    <LTTProductCard {product} shortTitle={data.shortTitles[product.id]} />
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion>
  <br>
  <br>
</div>
<div class="limit mx-auto p-2">
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
      <table class="table  rounded-md">
        <thead>
        <tr>
          <th>What changed</th>
          <td>Change seen</td>
          <th class="w-[42%]">Before</th>
          <th class="w-[42%]">After</th>
        </tr>
        </thead>
        <tbody>
        {#each countTo(20) as _}
          <tr>
            <td><div class="placeholder animate-pulse w-32"></div></td>
            <td><div class="placeholder animate-pulse w-16"></div></td>
            <td><div class="placeholder animate-pulse w-64"></div></td>
            <td><div class="placeholder animate-pulse w-64"></div></td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {:then changeHistory}
    <div class="table-container rounded-md">
      <table class="table  rounded-md">
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
          {@const SvelteComponent = getDiffComponent(field)}
          {@const SvelteComponent_1 = getDiffComponent(field)}
          <tr>
            <td>{getFieldName(field)}</td>
            <td><DateStamp epochSeconds={change.timestamp/1e3}/></td>
            <td><SvelteComponent before={change.old} after={change.new} displaying="before"/></td>
            <td><SvelteComponent_1 before={change.old} after={change.new} displaying="after"/></td>
          </tr>
        {/each}
        </tbody>
        <tfoot>
          <tr style="text-transform: initial !important;">
            <td class="p-2! opacity-70" colspan="4">
              Changes before <DateStamp epochSeconds={data.store.id === Store.US ? 1732525260 : 1781787820}/> are not available
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  {/await}
</div>

<style>
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