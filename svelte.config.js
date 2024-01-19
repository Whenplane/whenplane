import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/kit/vite';

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
				]
			}
		}),

		serviceWorker: {
			register: false
		}
	}
};

export default config;
