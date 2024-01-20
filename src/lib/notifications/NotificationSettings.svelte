<script>
  import { browser } from "$app/environment";
  import { getPushSubscription, sha256 } from "$lib/notifications/notificationUtils.js";

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let settingsFetch = browser ? fetchSettings() : new Promise(() => {});

  async function fetchSettings() {
    const sub = await getPushSubscription();
    if(!sub) {
      location.href = '';
      return null;
    }
    const hash = await sha256(sub.endpoint)
    const response = await fetch("/api/push/settings?hash=" + hash);
    if(response.status === 404) {
      await sub.unsubscribe();
      location.href = '';
      return null;
    }
    return await response.json();
  }

</script>

{#await settingsFetch}
  <span class="opacity-75">Loading notification settings</span>
{:then settings}
  <pre>{JSON.stringify(settings, null, '\t')}</pre>
{/await}