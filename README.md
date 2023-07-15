# When is WAN

When is WAN (aka [whenplane](https://www.whenplane.com)) is a site that is meant to make it easier to tell a few things

1. When the next WAN show is (compensating for timezones)
2. How late the WAN show is
3. How long the WAN show has been running
4. Historical start/end times

# Built with

This site was made using [Svelte](https://svelte.dev)
and [SvelteKit](https://kit.svelte.dev).

It is hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
and uses [Workers KV](https://developers.cloudflare.com/workers/learning/how-kv-works/)
to record start/end times automatically.

## How start/end times are automatically recorded
Since the pre-show always starts simultaneously on twitch and floatplane,
we can just look at the twitch API to tell if the pre-show has started or not.
If it has started, we double-check the title to check that it is indeed the WAN show,
and record the start date
(from the api to account for the delay between the stream starting and it being checked)

Once a pre-show is started, it is recorded in a temporary key in
[Workers KV](https://developers.cloudflare.com/workers/learning/how-kv-works/).

A similar process is used to determining the main show start time,
however this time using the YouTube API instead of twitch.
However, due to the massive rate-limiting on the YouTube API, we only use the real
YouTube API when there is an actual live stream. We determine if any stream is running
by using a fairly simple page-scraping solution. If they are streaming, *then* we use the
YouTube API to check the title, and record the start time.

The end time recording is simpler, however. There is not an easy way to get the end time of a stream,
so we just record the time that we see it was no longer online.

Long after the show will have ended, a simple [scheduled Worker](https://github.com/ajgeiss0702/wheniswan-taskrunner/)
will come along and collapse those 3 temporary keys (pre-show start, main show start, and show end times)
into one key for the day.

## How older start/end times are displayed
You might have noticed that shows much older than this site are
still displayed on the [history page](https://www.whenplane.com/history).
This is thanks to some [manual recording](https://github.com/ajgeiss0702/wheniswan/blob/master/src/lib/oldHistory.ts).

This data is recorded by going through and looking at VODs.
The process of adding older shows takes a lot of time,
which is why it takes so long for older shows to be added.

### Contributing to older times

I've written [a page describing how **you** can help by contributing old times](https://github.com/ajgeiss0702/wheniswan/wiki/Contributing-old-times).

# Developing

If you wish to contribute, here are a few pointers.

I would recommend using [pnpm](https://pnpm.io/installation)
as it is much faster than npm, especially if you install the same dependencies often.
It also saves disk space if you have multiple projects with the same dependencies.

The [SvelteKit docs](https://kit.svelte.dev/docs/project-structure) are a great way to
learn the structure of the project, as well as what certain files/folders are there for.

I would also recommend going through the [Svelte Tutorial](https://svelte.dev/tutorial/basics)
(at least the intro) to understand svelte components. If you already know HTML/JS/CSS, it's easy!
(I actually had *fun* while learning svelte)

## Starting a dev server

Before starting the dev server, make sure you've installed the dependencies
```bash
pnpm install
```

Next, you need to set your API credentials. Create a `.env` file and fill in the contents

```env
TWITCH_CLIENT_ID=...
TWITCH_SECRET=...
```

The `.env` file should be ignored by git, but still take caution to ensure that secrets do not make it into any commits!

The `.env` file is only used during development. Variables in production are set in the cloudflare dashboard.

After setting up your credentials, you can start a dev server and preview your changes:
```bash
pnpm dev
```

Once the server is started, you can press `h` to see the shortcuts you can use:

```
Shortcuts
  press r to restart the server
  press u to show server url
  press o to open in browser
  press c to clear console
  press q to quit
```

Generally, I only use `o` (to open in a browser) and `q` (to quit)

Press `o` to open the preview in your browser.
Note that it will be a bit slower than the final site,
as most optimisations only happen during final build time.

A local KV emulator is used automatically, which stores cache data and history in the `kv-data` folder
