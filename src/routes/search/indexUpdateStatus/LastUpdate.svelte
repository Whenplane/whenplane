<script lang="ts">
  import { SearchClient } from "typesense";
  import { onMount } from "svelte";
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import type { CombinedSearchResult } from "$lib/search/search_types.ts";
  import type { SearchResponse } from "typesense/lib/Typesense/Documents";
  import { getDateFormatLocale } from "$lib/prefUtils.ts";
  import { getPreviousWAN, getUTCDate } from "$lib/timeUtils.ts";
  import OutdatedNotice from "./OutdatedNotice.svelte";
  import CheckCircleFill from "svelte-bootstrap-icons/lib/CheckCircleFill.svelte";
  import UpToDate from "./UpToDate.svelte";
  import { version } from "$app/environment";

  const searchClient = new SearchClient({
    'nodes': [{
      'host': 'search.ajg0702.us',
      'port': 443,
      'protocol': 'https'
    }],
    // this api key only has access to search, don't worry
    'apiKey': "kxB1kGPA1HWgWuYtbDmWcr4y5aGKYsQf",
    'connectionTimeoutSeconds': 10,
    cacheSearchResultsForSeconds: 120
  });

  type IndexUpdate = {
    dateString: string;
    isUpToDate: boolean;
  }

  let lastTitle: Promise<IndexUpdate | null> = $state(new Promise(() => {}));
  let lastTopic: Promise<IndexUpdate | null> = $state(new Promise(() => {}));
  let lastTranscript: Promise<IndexUpdate | null> = $state(new Promise(() => {}));
  let lastMerchMessage: Promise<IndexUpdate | null> = $state(new Promise(() => {}));

  function formatDate(date: number) {
    const s = date+"";
    return s.substring(0, 4) + "/" + s.substring(4, 6) + "/" + s.substring(6);
  }

  function dateNumber(d: Date) {
    return Number(getUTCDate(d).replaceAll("/", ""));
  }

  onMount(async () => {
    const previousDateNumber = dateNumber(getPreviousWAN(
      undefined,
      await fetch("/api/alternateStartTimes?v=" + version)
        .then(r => r.json())
    ));
    lastTitle = getLatest("title", previousDateNumber);
    lastTopic = getLatest("topic", previousDateNumber);
    lastTranscript = getLatest("transcript-chunk", previousDateNumber);
    lastMerchMessage = getLatest("[message, reply]", previousDateNumber);
  })

  function getLatest(type: string, previousDateNumber: number) {
    return searchClient.collections<CombinedSearchResult>("whenplane-all").documents().search({
      q: "*",
      query_by: "text",
      sort_by: "showDate:desc",
      filter_by: "type:" + (type.startsWith("[") ? "" : "=") + type,
      page: 1,
      per_page: 1,
      exclude_fields: ["text"],
    }).then(r => {
      const results = r as SearchResponse<CombinedSearchResult>;
      if(!results.hits?.length) return null;
      const latestDateNumber = results.hits[0].document.showDate;
      const latest = new Date(formatDate(latestDateNumber));
      return {
        dateString: latest.toLocaleDateString(getDateFormatLocale()),
        isUpToDate: latestDateNumber >= previousDateNumber
        // isUpToDate: false
      } satisfies IndexUpdate;
    })
  }

</script>
These dates show the latest data that the search index has.<br>

Last title indexed:
{#await lastTitle}
  <ProgressRing class="inline-block" width="w-6" stroke={250}/>
{:then d}
  {#if !d}
    <OutdatedNotice/> <span class="opacity-60">none?</span>
  {:else}
    {#if d.isUpToDate}
      <UpToDate/>
      {d.dateString}
    {:else}
      <OutdatedNotice/>
      {d.dateString}
    {/if}
  {/if}
{/await}
<br>

Last topic indexed:
{#await lastTopic}
  <ProgressRing class="inline-block" width="w-6" stroke={250}/>
{:then d}
  {#if !d}
    <OutdatedNotice/> <span class="opacity-60">none?</span>
  {:else}
    {#if d.isUpToDate}
      <UpToDate/>
      {d.dateString}
    {:else}
      <OutdatedNotice/>
      {d.dateString}
    {/if}
  {/if}
{/await}
<br>

Last transcript indexed:
{#await lastTranscript}
  <ProgressRing class="inline-block" width="w-6" stroke={250}/>
{:then d}
  {#if !d}
    <OutdatedNotice/> <span class="opacity-60">none?</span>
  {:else}
    {#if d.isUpToDate}
      <UpToDate/>
      {d.dateString}
    {:else}
      <OutdatedNotice/>
      {d.dateString}
    {/if}
  {/if}
{/await}
<br>

Last merch message indexed:
{#await lastMerchMessage}
  <ProgressRing class="inline-block" width="w-6" stroke={250}/>
{:then d}
  {#if !d}
    <OutdatedNotice/> <span class="opacity-60">none?</span>
  {:else}
    {#if d.isUpToDate}
      <UpToDate/>
      {d.dateString}
    {:else}
      <OutdatedNotice/>
      {d.dateString}
    {/if}
  {/if}
{/await}