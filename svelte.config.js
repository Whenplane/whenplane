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

	kit: {
		adapter: adapter({
			routes: {
				exclude: [
					"<all>",
					"/*/wp-includes",
					"/*/wp-includes/*",
					"/wp-includes",
					"/wp-includes/*",
					"/discord",
					"/boca-time"
				]
			}
		}),

		serviceWorker: {
			register: false
		},

		prerender: {
			handleHttpError: ({path, status, referrer, referenceType}) => {
				if(path.startsWith("/cdn-cgi")) return;
				throw new Error(status + " " + path + " (" + referenceType + " from " + referrer + ")");
			}
		}
	}
};

export default config;
