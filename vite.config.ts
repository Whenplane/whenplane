import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { enhancedImages } from '@sveltejs/enhanced-img';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), enhancedImages(), sveltekit()],
	resolve: {
		alias: {
			'node:crypto': path.resolve(__dirname, 'src/lib/crypto-polyfill.ts'),
			crypto: path.resolve(__dirname, 'src/lib/crypto-polyfill.ts')
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
