<script lang="ts">
  import MoreLinks from "$lib/MoreLinks.svelte";
  import CaretDownFill from "svelte-bootstrap-icons/lib/CaretDownFill.svelte";
  import { popup } from "$lib/replacements/popup";
  import { slide } from "svelte/transition";


  let moreDropdownOpen = $state(false)
</script>

<button class="btn preset-tonal-surface border border-surface-500 bg-surface-900/60 rounded-xl" use:popup={{
					event: 'click',
					target: 'moreDropdown',
					placement: 'bottom',
					state: (s) => moreDropdownOpen = s.state
				}}>
  <span class="capitalize">More</span>
  <span class:rotate-180={moreDropdownOpen} class="transition-transform duration-175">
						<CaretDownFill/>
					</span>
</button>
<div class="card w-58 shadow-2xl! overflow-hidden z-20 bg-surface-700/75! absolute backdrop-blur-[5px] transition-opacity duration-250" data-popup="moreDropdown" style="opacity: 0; pointer-events: none; display: none;">
  {#if moreDropdownOpen}
    <div transition:slide={{duration: 150}}>
      <MoreLinks/>
    </div>
  {/if}
  <div class="arrow bg-surface-700/90"></div>
</div>