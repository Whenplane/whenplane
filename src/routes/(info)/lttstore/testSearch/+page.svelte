<script>
  import ProductSearchModal from "../ProductSearchModal.svelte";
  import { modalStore } from "@skeletonlabs/skeleton";

  function openSearch() {
    modalStore.trigger({
      type: 'component',
      component: {
        ref: ProductSearchModal
      }
    })
  }
</script>

<button class="btn variant-ghost-primary" onclick={openSearch}>Open</button>

<ProductSearchModal/>