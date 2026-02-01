<script lang="ts">
	import { typed } from '$lib';
	import type { PageData } from '../../../../.svelte-kit/types/src/routes';
	import sanitizeHtml from 'sanitize-html';
	import { newsSanitizeSettings } from '$lib/news/news.ts';
	import { page } from '$app/state';

	let { data = typed<PageData>() } = $props();
</script>

<svelte:head>
	<title>Whenplane News</title>
	<meta
		name="description"
		content="I will occasionally post news and updates here related to Whenplane here."
	/>
</svelte:head>

<ol class="breadcrumb pt-2 pl-2">
	<li class="crumb">
		<a class="anchor hover-underline" href="/"
			>{page.url.hostname === 'whenwan.show' ? 'whenwan.show' : 'Whenplane'}</a
		>
	</li>
	<li class="crumb-separator" aria-hidden="true">›</li>
	<li class="crumb">News</li>
</ol>
<br />

<div class="limit mx-auto px-2">
	<h1>{page.url.hostname === 'whenwan.show' ? 'whenwan.show' : 'Whenplane'} News</h1>
	I will occasionally post news and updates here related to
	{page.url.hostname === 'whenwan.show' ? 'whenwan.show' : 'Whenplane'}
	here.<br />
	<br />
	<hr />
	{#each data.results as post}
		{@const postDate = new Date(post.timestamp)}
		<a class="hidden-link cursor-pointer" href="news/{post.url}">
			<h2>{post.title}</h2>
			<div class="date text-right opacity-70">
				{postDate.toLocaleDateString(undefined, { dateStyle: 'long' })}
			</div>
			<div class="snippet">
				{@html sanitizeHtml(post.body, newsSanitizeSettings)}
			</div>
			<hr />
		</a>
	{/each}
</div>

<style>
	.snippet {
		max-height: 5em;
		overflow-y: hidden;
		mask: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
	}
	hr {
		margin-top: 0.75em;
		margin-bottom: 0.75em;
	}

	.date {
		font-size: 0.9em;
		line-height: 0.5em;
		position: relative;
		bottom: 0.25rem;
	}
</style>
