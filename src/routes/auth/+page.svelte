<script lang="ts">
  let { data } = $props();
</script>
<div class="text-right px-2">
  {#if !data.session}
    Not logged in. <a href="/auth/login">Log In</a>
  {:else}
    Logged in as {data.session.username}. <a href="/auth/logout">Log Out</a>
  {/if}
</div>
<br>

<pre>{JSON.stringify(data, undefined, '\t')}</pre>