<script lang="ts">
  import sanitizeHtml from "sanitize-html";
  import { page } from "$app/state";
  import { truncateText } from "$lib/utils.js";
  import { Accordion } from "@skeletonlabs/skeleton-svelte";
  import type {PageProps} from "./$types";
  import ChevronDown from "svelte-bootstrap-icons/lib/ChevronDown.svelte";
	import { slide } from "svelte/transition";
  import LTTProductCard from "$lib/lttstore/LTTProductCard.svelte";
  import ChangeHistory from "$lib/lttstore/ChangeHistory.svelte";

  let { data }: PageProps = $props();

  let products = $derived(JSON.parse(data.collection.products));
  let image = $derived(data.collection.image ? JSON.parse(data.collection.image) : data.collection.image)

  let hideUpdated = $state(true);

  let truncatedDescription = $derived(truncateText(sanitizeHtml(data.collection.description ?? "", {allowedTags: []}), 159));
</script>

<svelte:head>
  <title>{data.collection.title} Collection - Whenplane LTTStore Watcher</title>
  {#if data.collection.description}
    <meta name="description" content={truncatedDescription}/>
  {/if}
  <meta property="og:type" content="website">
  <meta property="og:title" content={data.collection.title}>
  <meta property="og:description" content={truncatedDescription}>
  <meta property="og:site_name" content="Whenplane LTTStore Watcher ({data.store.storeName})">
  <meta property="og:url" content="https://whenplane.com/lttstore/{data.store.storeName.toLowerCase()}/collections/{data.collection.handle}">
  <meta property="og:locale" content="en_US">
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
                  {#each products as product, i}
                    <LTTProductCard {product} shortTitle={data.shortTitles[product.id]} lazyLoadImage={i > 10} />
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
  {#await data.initialChangeHistory}
    <ChangeHistory
      id={data.collection.id}
      firstSeen={new Date(data.collection.published_at).getTime()}
      differences={20}
      collection={true}
    />
  {:then changeHistory}
    <ChangeHistory
      initialChangeHistory={changeHistory}
      id={data.collection.id}
      firstSeen={new Date(data.collection.published_at).getTime()}
      collection={true}
      {hideUpdated}
    />
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