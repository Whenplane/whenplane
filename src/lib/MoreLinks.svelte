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
<table class="w-58">
  {#each links as link}
    <tr>
      <td>
        <a class="unstyled hidden-link bg-surface-500" href={link.href}>
          <link.icon width="20" height="20"/>
        </a>
      </td>
      <td>
        <a class="unstyled hidden-link bg-surface-500" href={link.href}>
          {link.name}
        </a>
      </td>
    </tr>
  {/each}
</table>

<style>
    td > a {
        display: block;
        padding: 0.5rem 0.25rem;
    }

    tr:hover {
        --tw-brightness: brightness(1.15);
        filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
    }

    td {
        padding: 0;
        font-size: 1rem;
    }

    td:nth-child(1) {
        text-align: center;
    }
    td:nth-child(1) > a {
        padding-left: 1rem;
    }

    td:nth-child(2) {
        text-align: left;
    }
    td:nth-child(2) > a {
        padding-right: 0.75rem;
    }
</style>