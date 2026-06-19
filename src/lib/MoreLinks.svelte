<script lang="ts">
  import Search from "svelte-bootstrap-icons/lib/Search.svelte";
  import Bell from "svelte-bootstrap-icons/lib/Bell.svelte";
  import ChatDots from "svelte-bootstrap-icons/lib/ChatDots.svelte";
  import Plug from "svelte-bootstrap-icons/lib/Plug.svelte";
  import Bag from "svelte-bootstrap-icons/lib/Bag.svelte";
  import Newspaper from "svelte-bootstrap-icons/lib/Newspaper.svelte";
  import InfoCircle from "svelte-bootstrap-icons/lib/InfoCircle.svelte";
  import Floatplane from "$lib/svg/Floatplane.svelte";
  import DiscordSymbol from "$lib/svg/DiscordSymbol.svelte";

  const links = [
    {
      icon: Search,
      name: "WAN Show Search",
      href: "/search"
    },
    {
      icon: Bell,
      name: "Push Notifications",
      href: "/notifications"
    },
    {
      icon: ChatDots,
      name: "Merch Messages Index",
      href: "/merch-messages"
    },
    {
      icon: Plug,
      name: "Whenplane Extension",
      href: "/extension"
    },
    {
      icon: Bag,
      name: "LTTStore Watcher",
      href: "/lttstore"
    },
    {
      icon: Floatplane,
      name: "Floatplane Watcher",
      href: "/floatplane"
    },
    {
      icon: Newspaper,
      name: "Whenplane News",
      href: "/news"
    },
    {
      icon: InfoCircle,
      name: "About & Preferences",
      href: "/about"
    },
    {
      icon: DiscordSymbol,
      name: "Whenplane Discord",
      href: "/discord"
    }
  ]
</script>
<div class="table w-58">
  {#each links as link}
    <a class="table-row unstyled hidden-link hover:bg-white/5 focus:bg-white/5 transition-colors duration-100" href={link.href}>
      <div class="table-cell pl-4 pr-1.5 align-middle">
        <link.icon width="20" height="20"/>
      </div>
      <div class="table-cell text-left">
        {link.name}
      </div>
    </a>
  {/each}
</div>

<style>
    @reference "#app.css";

    .table-cell {
        @apply py-2;
        font-size: 1rem;
    }


    .table-row:nth-child(1) {
        text-align: center;
    }
</style>