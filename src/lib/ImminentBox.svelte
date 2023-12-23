<script lang="ts">
  import { floatplaneState } from "$lib/stores";
  import { dev } from "$app/environment";
  import {popup} from "@skeletonlabs/skeleton";
  import Info from "$lib/svg/Info.svelte";
  import { removeAfterLastDash } from "$lib/utils.js";

  export let hasDone: boolean;

  const day = new Date().getUTCDay();
  const dayIsCloseEnough = day === 5 || day === 6;
</script>

<!--
/**
 * @description The imminence of the next episode as a number
 * @enum {number}
 * @readonly
 * @property {number} DISTANT - The next episode is more than 24 hours away still
 * @property {number} TODAY - The next episode is today
 * @property {number} SOON - The last check revealed a modification to the metadata of the next episode
 * @property {number} IMMINENT - The last check revealed the thumbnail had been updated
 */
export enum ImminenceEnumeration {
  DISTANT = 0,
  TODAY = 1,
  SOON = 2,
  IMMINENT = 3,
}
-->

{#if !hasDone && !$floatplaneState?.isWAN && ((dayIsCloseEnough && $floatplaneState?.imminence === 3) /*|| dev*/)}
  <div class="card border-2 p-2 !border-green-600 !bg-opacity-20 !bg-green-600 block relative pb-0 mobile-add-padding">
    <a href={$floatplaneState?.thumbnail} target="_blank" rel="noopener">
      <img src={$floatplaneState?.thumbnail} class="inline-block h-32 rounded-lg mobile-full-width" alt="Dan">
    </a>
    <div class="inline-flex h-32 items-center justify-center ml-4 mobile-full-width">
      <div>
        <h2 class="!mb-0">The show might start soon!</h2>
        {#if $floatplaneState?.title}
          "{removeAfterLastDash($floatplaneState?.title)}"
          <br>
        {/if}
        The thumbnail has been updated.
        <div
          class="text-surface inline-block info [&>*]:pointer-events-none"
          use:popup={{
            event: 'hover',
            target: 'imminent-thumbnail',
            placement: 'bottom'
          }}
        >
          <Info/>
        </div>
        <div class="absolute bottom-0 right-3 opacity-60" style="font-size: 0.8em;">
          Imminence detection by The WAN DB
        </div>
      </div>
    </div>
  </div>
{/if}


<div class="card p-4 whitespace-nowrap shadow-x1 z-10 font-normal" data-popup="imminent-thumbnail" style="margin-top: 0;">
  Generally when a thumbnail is uploaded, all hosts are in their seats ready to start the show.<br>
  Usually the show starts within 10 minutes of a thumbnail being uploaded.
</div>


<style>

  @media (max-width: 600px) {
      .mobile-full-width {
          height: initial !important;
          width: 100%;
          margin-left: 0;
      }
      .mobile-add-padding {
          padding-bottom: 1em;
      }
  }

  @media (pointer: coarse) {
      .info {
          display: none;
      }
  }

</style>
