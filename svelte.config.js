import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	vitePlugin: {
		exclude: "**/time-overrides.json"
	},

	compilerOptions: {
		experimental: {
			async: true
		}
	},

	kit: {
		adapter: adapter({
			routes: {
				exclude: [
          "<all>",

					"/apple-touch-icon.png",
					"/apple-touch-icon-precomposed.png",

					"/discord",
					"/boca-time",
					"/products/*",
					// "/history/show/*/*/merch-messages/*",
					"/contact",
          "/history/show",
					// "/.well-known/*",
					"/favicon.ico",
					"/wan.png",

					// Stuff that vulnerability crawlers like to spam (these should be blocked in cloudflare but include them here just in case)
					"/*/wp-includes",
					"/*/wp-includes/*",
					"/wp-includes",
					"/wp-includes/*",
					"/wp-admin/*",
					"/wp-content/*",
					"/*.php",
					"/*.php7",
					"/*/*.php",
					"/*/*.php7",
					"/libraries/*",
					"/.env",
					"/.git/*",
				]
			}
		}),

		serviceWorker: {
			register: false
		},

		prerender: {
			handleHttpError: ({path, status, referrer, referenceType, message}) => {
				if(path.startsWith("/cdn-cgi")) return;
				throw new Error(status + (message !== status+" "+path ? " " + message : "") + " " + path + " (" + referenceType + " from " + referrer + ")");
			}
		}
	}
};

export default config;
