<script lang="ts">
    import { page } from "$app/stores";
    import { browser, building } from "$app/environment";

    let alt = "\"This is Awkward\" - Thumbnail from March 12th, 2021"

    let attempt = !building ? Number($page.url.searchParams.get("attempt") ?? 0) : 0;

    const reloadPages = [
      "/",
      "/boca-marathon"
    ]

    if(browser && $page.status === 500 && reloadPages.includes($page.url.pathname)) {
        checkForReload();
    }

    function checkForReload() {
        // Auto-reload if root page throws a 500. This usually just happens because the data request failed. Thanks sveltekit..
        setTimeout(() => {
            const newUrl = new URL(location.href);
            newUrl.searchParams.set("attempt", (++attempt) + "")

            history.replaceState({}, document.title, newUrl.toString());

            // check if the page is ok before redirecting
            fetch(newUrl.toString())
              .then(r => {
                  if(r.ok) {
                      location.href = newUrl.toString();
                  } else {
                      checkForReload();
                  }
              })
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              .catch(checkForReload);

        }, Math.min(Math.max(3e3, 3e3 * (attempt / 3)), 30e3));// delay by 3-30 seconds so that we don't spam if the site is actually broken
    }
</script>

<div class="text-center pt-16">
    <a href="/history/show/2021/03/12" class="inline-block">
        <img src="/this_is_awkward.webp" {alt} title={alt}/>
    </a>
    <h1>{$page.status}</h1>
    {$page.error?.message}
    {#if $page.url.pathname !== "/"}
        <br>
        <br>
        <br>
        <a href="/">Go Home</a>
    {/if}
</div>

<style>
    h1 {
        margin-top: 2rem;
    }
    img {
        height: 50vh;
    }
    
    @media (max-width: 95vh) {
        img {
            height: auto;
            max-width: 90vw;
        }
    }

    :global(.dark) img {
        background-color: black;
    }
</style>