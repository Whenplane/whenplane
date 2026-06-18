<script lang="ts">
  import USFlag from "./flags/us.webp"
  import Global from "./flags/Global.svelte";
</script>
<div class="min-h-dvh flex justify-center items-center text-center px-4">
  <div>
    <h1>Please select a store</h1>
    <div class="flex justify-center items-center gap-2 flex-wrap">
      <a href="/lttstore/us">
        <img class="max-w-64 w-[95dvw] aspect-19/10 object-fill" src={USFlag} alt="US" />
        United Sates
      </a>
      <a href="/lttstore/global">
        <div class="max-w-64 w-[95dvw]">
          <Global/>
        </div>
        Global
      </a>
    </div>
  </div>
</div>