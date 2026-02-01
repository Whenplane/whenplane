<script>
  import ProductSearchModal from "../ProductSearchModal.svelte";
  import { modalStore } from "@skeletonlabs/skeleton-svelte";

  function openSearch() {
    modalStore.trigger({
      type: 'component',
      component: {
        ref: ProductSearchModal
      }
    })
  }
</script>

<button class="btn preset-tonal-primary border border-primary-500" onclick={openSearch}>Open</button>

<ProductSearchModal/>