<script lang="ts">
  import USFlag from "./flags/us.webp"
  import Global from "./flags/Global.svelte";
</script>
<div class="min-h-dvh flex justify-center items-center text-center px-4">
  <div>
    <h1>Please select a store</h1>
    <div class="flex justify-center items-center gap-2 flex-wrap">
      <a href="/lttstore/us">
        <img class="w-64 aspect-19/10 object-fill" src={USFlag} alt="US" />
        US
      </a>
      <a href="/lttstore/global">
        <Global/>
        Global
      </a>
    </div>
  </div>
</div>