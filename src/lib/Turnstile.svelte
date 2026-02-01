<script lang="ts">
	import { Turnstile } from 'svelte-turnstile';
	import { typed } from '$lib';

	let {
		siteKey = typed<string>(),
		passed = $bindable<boolean>(false)
	} = $props();

	function unPass() {
		passed = false;
	}
	function pass() {
		passed = true;
	}
</script>

<br />
<div class="turnstile inline-block mx-auto">
	<Turnstile
		{siteKey}
		on:turnstile-error={unPass}
		on:turnstile-expired={unPass}
		on:turnstile-timeout={unPass}
		on:turnstile-callback={pass}
	/>
</div>
<br />

<style>
	div {
		height: 65px;
		width: 300px;
	}
</style>
