<script lang="ts">
	import { capitalize, type SpecialStream } from '$lib/utils.ts';
	import CheckCircle from 'svelte-bootstrap-icons/lib/CheckCircle.svelte';
	import XCircle from 'svelte-bootstrap-icons/lib/XCircle.svelte';
	import ExclamationCircle from 'svelte-bootstrap-icons/lib/ExclamationCircle.svelte';
	import { typed } from '$lib';

	let {
		service = typed<'floatplane' | 'twitch' | 'youtube'>(),
		specialStreamData = typed<SpecialStream>()
	} = $props();

	let isOn = $derived(specialStreamData['on' + capitalize(service)] ?? false);
	let note = $derived(specialStreamData[service + 'Notes']);
</script>

{#if isOn && !note}
	<span class="green">
		<CheckCircle style="display: inline-block;" />
	</span>
{:else if isOn && note}
	<span class="yellow">
		<ExclamationCircle style="display: inline-block;" />
	</span>
	({note})
{:else}
	<span class="red">
		<XCircle style="display: inline-block;" />
	</span>
	{#if note}
		({note})
	{/if}
{/if}

<style>
	.red {
		color: red;
	}
	.yellow {
		color: orange;
	}
	.green {
		color: green;
	}
</style>
