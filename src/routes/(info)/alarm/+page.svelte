<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { browser, dev } from "$app/environment";
	import { page } from "$app/state";
	import Socket from "$lib/Socket.svelte";
	import { overwriteData } from "$lib/stores.ts";
	import { timeString } from "$lib/timeUtils.ts";
	import { getTimePreference } from "$lib/prefUtils.ts";
	import type { AggregateResponse } from "../../api/(live-statuses)/aggregate/+server";

	let { data } = $props();

	type Trigger = "thumbnail" | "preshow" | "mainshow";
	type Signals = Record<Trigger, boolean>;

	const triggerOptions: { id: Trigger; name: string; description: string }[] = [
		{
			id: "thumbnail",
			name: "Thumbnail uploaded",
			description:
				"A new thumbnail is uploaded to the stream page. This usually happens shortly before the show starts, so it's the earliest warning."
		},
		{
			id: "preshow",
			name: "Pre-show starts",
			description: "The WAN pre-show goes live on Twitch."
		},
		{
			id: "mainshow",
			name: "Main show starts",
			description: "The main WAN Show goes live on YouTube."
		}
	];

	const alarmTexts: Record<Trigger, string> = {
		thumbnail: "The thumbnail was uploaded!",
		preshow: "The pre-show is live!",
		mainshow: "The main show is live!"
	};

	function extractSignals(status: AggregateResponse): Signals {
		return {
			thumbnail: !!status.floatplane?.isThumbnailNew && !!status.floatplane?.isWAN,
			preshow: !!status.twitch?.isLive && !!status.twitch?.isWAN,
			mainshow: !!status.youtube?.isLive && !!status.youtube?.isWAN
		};
	}

	let trigger: Trigger = $state("thumbnail");
	let armed = $state(false);
	// svelte-ignore state_referenced_locally
	let signals: Signals = $state(
		data.liveStatus
			? extractSignals(data.liveStatus)
			: { thumbnail: false, preshow: false, mainshow: false }
	);
	// svelte-ignore state_referenced_locally
	let details = $state({
		thumbnailUrl: data.liveStatus?.floatplane?.thumbnail,
		thumbnailAgeAt:
			data.liveStatus?.floatplane?.thumbnailAge != null
				? { age: data.liveStatus.floatplane.thumbnailAge, fetchedAt: Date.now() }
				: undefined,
		preShowStarted: data.liveStatus?.twitch?.started,
		mainShowStarted: data.liveStatus?.youtube?.started
	});
	let alarm = $state<{ trigger: Trigger; at: number; sound: boolean } | undefined>();
	let lastUpdate = $state(Date.now());
	let nowTick = $state(Date.now());

	if (browser) {
		const stored = localStorage.getItem("alarmTrigger");
		if (stored === "thumbnail" || stored === "preshow" || stored === "mainshow")
			trigger = stored;
	}

	$effect(() => {
		localStorage.setItem("alarmTrigger", trigger);
	});

	function processSignals(next: Signals) {
		if (armed && !alarm && !signals[trigger] && next[trigger]) {
			fireAlarm(trigger);
		}
		signals = next;
	}

	type WsMessage = {
		floatplane?: { isThumbnailNew?: boolean; thumbnail?: string; title?: string };
		twitch?: { isLive?: boolean; isWAN?: boolean };
		youtube?: { isLive?: boolean; isWAN?: boolean };
	};

	function handleWsMessage(raw: unknown) {
		const message = raw as WsMessage | undefined;
		if (!message || typeof message !== "object") return;

		lastUpdate = Date.now();

		processSignals({
			thumbnail:
				!!message.floatplane?.isThumbnailNew &&
				!!message.floatplane?.title?.toLowerCase().includes(" wan "),
			preshow: !!message.twitch?.isLive && !!message.twitch?.isWAN,
			mainshow: !!message.youtube?.isLive && !!message.youtube?.isWAN
		});

		if (message.floatplane?.thumbnail) details.thumbnailUrl = message.floatplane.thumbnail;
	}

	async function pollStatus() {
		try {
			const response = await fetch("/api/aggregate?fast=false");
			if (!response.ok) throw new Error("Status fetch failed: " + response.status);
			const status: AggregateResponse = await response.json();

			lastUpdate = Date.now();
			processSignals(extractSignals(status));

			details = {
				thumbnailUrl: status.floatplane?.thumbnail ?? details.thumbnailUrl,
				thumbnailAgeAt:
					status.floatplane?.thumbnailAge != null
						? { age: status.floatplane.thumbnailAge, fetchedAt: Date.now() }
						: details.thumbnailAgeAt,
				preShowStarted: status.twitch?.started,
				mainShowStarted: status.youtube?.started
			};
		} catch (e) {
			console.debug("[alarm] Status poll failed", e);
		}
	}

	let audioContext: AudioContext | undefined;
	let alarmSound: { stop: () => void } | undefined;
	let testTimeout: ReturnType<typeof setTimeout> | undefined;

	function ensureAudioContext() {
		const AudioContextClass =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioContextClass) return;
		if (!audioContext) audioContext = new AudioContextClass();
		if (audioContext.state === "suspended") void audioContext.resume();
	}

	function startAlarmSound(): boolean {
		if (!audioContext) return false;
		if (audioContext.state === "suspended") void audioContext.resume();

		alarmSound?.stop();

		const ctx = audioContext;

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.0001, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.06);
		gain.connect(ctx.destination);

		const osc1 = ctx.createOscillator();
		osc1.type = "square";
		osc1.frequency.value = 720;

		const osc2 = ctx.createOscillator();
		osc2.type = "sawtooth";
		osc2.frequency.value = 724;

		const sweep = ctx.createOscillator();
		sweep.type = "sine";
		sweep.frequency.value = 1.2;
		const sweepGain = ctx.createGain();
		sweepGain.gain.value = 190;
		sweep.connect(sweepGain);
		sweepGain.connect(osc1.frequency);
		sweepGain.connect(osc2.frequency);

		osc1.connect(gain);
		osc2.connect(gain);

		osc1.start();
		osc2.start();
		sweep.start();

		alarmSound = {
			stop: () => {
				const t = ctx.currentTime;
				gain.gain.setValueAtTime(gain.gain.value, t);
				gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
				osc1.stop(t + 0.2);
				osc2.stop(t + 0.2);
				sweep.stop(t + 0.2);
			}
		};
		return true;
	}

	function stopAlarmSound() {
		alarmSound?.stop();
		alarmSound = undefined;
	}

	function testAlarm() {
		ensureAudioContext();
		if (!startAlarmSound()) return;
		if (testTimeout) clearTimeout(testTimeout);
		testTimeout = setTimeout(() => {
			stopAlarmSound();
			testTimeout = undefined;
		}, 2500);
	}

	let originalTitle: string | undefined;
	let vibrateInterval: ReturnType<typeof setInterval> | undefined;

	function fireAlarm(which: Trigger) {
		if (testTimeout) {
			clearTimeout(testTimeout);
			testTimeout = undefined;
		}
		stopAlarmSound();

		originalTitle = document.title;
		document.title = "WAN ALARM!";

		const played = startAlarmSound();
		alarm = { trigger: which, at: Date.now(), sound: played };

		navigator.vibrate?.([600, 200, 600, 200, 600, 200, 600]);
		if (vibrateInterval) clearInterval(vibrateInterval);
		vibrateInterval = setInterval(
			() => navigator.vibrate?.([600, 200, 600, 200, 600, 200, 600]),
			4000
		);
	}

	function overlayClick() {
		if (alarm && !alarm.sound) {
			ensureAudioContext();
			if (startAlarmSound()) alarm.sound = true;
		}
	}

	let wakeLock: WakeLockSentinel | undefined;

	async function requestWakeLock() {
		try {
			wakeLock = await navigator.wakeLock?.request("screen");
		} catch (e) {
			console.debug("[alarm] Wake lock request failed", e);
		}
	}

	function releaseWakeLock() {
		wakeLock?.release().catch(() => {});
		wakeLock = undefined;
	}

	function arm() {
		ensureAudioContext();
		requestWakeLock();
		armed = true;
	}

	function disarm() {
		armed = false;
		stopAlarmSound();
		if (testTimeout) {
			clearTimeout(testTimeout);
			testTimeout = undefined;
		}
		if (vibrateInterval) {
			clearInterval(vibrateInterval);
			vibrateInterval = undefined;
		}
		navigator.vibrate?.(0);
		releaseWakeLock();
		if (alarm && originalTitle) document.title = originalTitle;
		alarm = undefined;
	}

	let thumbnailAgeDisplay = $derived(
		details.thumbnailAgeAt
			? timeString(
					details.thumbnailAgeAt.age + (nowTick - details.thumbnailAgeAt.fetchedAt),
					true,
					false
				)
			: undefined
	);

	let staleConnection = $derived(nowTick - lastUpdate > 60e3);
	let selectedOption = $derived(triggerOptions.find((option) => option.id === trigger));

	function formatTime(timestamp: string | undefined): string | undefined {
		if (!timestamp) return undefined;
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) return undefined;
		return date.toLocaleTimeString(undefined, { hour12: getTimePreference() });
	}

	let pollInterval: ReturnType<typeof setInterval> | undefined;
	let tickerInterval: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		void pollStatus();
		pollInterval = setInterval(pollStatus, 15e3);

		tickerInterval = setInterval(() => {
			nowTick = Date.now();
			// treat websocket pings as updates so the page doesn't look stale while connected
			if (overwriteData.lastMessage > lastUpdate) lastUpdate = overwriteData.lastMessage;
		}, 1e3);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
		if (tickerInterval) clearInterval(tickerInterval);
		disarm();
	});
</script>

<svelte:head>
	<title>WAN Alarm - {page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</title>
	<meta
		name="description"
		content="Set off a loud alarm in your browser when the WAN Show thumbnail is uploaded, or when the pre-show or main show goes live."
	/>
</svelte:head>

{#if data.useWebSocket}
	<Socket
		events={["aggregate"]}
		invalidate={false}
		autoInvalidateAfterNoData={true}
		on:data={(e) => handleWsMessage(e.detail.data)}
	/>
{/if}

<svelte:window
	onvisibilitychange={() => {
		if (document.visibilityState === "visible" && armed) requestWakeLock();
	}}
/>

<ol class="breadcrumb pt-2 pl-2">
	<li class="crumb">
		<a class="anchor hover-underline" href="/"
			>{page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a
		>
	</li>
	<li class="crumb-separator" aria-hidden="true">›</li>
	<li class="crumb">WAN Alarm</li>
</ol>

<div class="limit mx-auto m-2 p-2 pb-16">
	<h1>WAN Alarm</h1>

	<p>
		Set off a loud alarm in your browser when something happens with the WAN Show.<br>
		Pick what event should set it off, then arm the alarm and keep this page open.
	</p>
	<p class="opacity-75 pt-2">
		This is not a push notification. The alarm plays straight from this tab, so it only works
		while this page stays open (it can be in the background as long as it doesnt get unloaded).
	</p>
	<p class="opacity-75">
		If you want push notifications, head to the <a href="/notifications">notifications page</a>.
	</p>

	<br>
	<hr />
	<br>

	<h2>Set off the alarm when...</h2>

	<div class="flex flex-col gap-2 max-w-2xl mx-auto">
		{#each triggerOptions as option (option.id)}
			<label
				class="flex items-start gap-3 card p-3 cursor-pointer border-2 transition-colors {trigger ===
				option.id
					? 'border-primary-500! bg-primary-500/10'
					: 'border-surface-500 hover:border-surface-300'}"
			>
				<input
					type="radio"
					name="alarmTrigger"
					value={option.id}
					bind:group={trigger}
					class="sr-only"
				/>
				<span
					class="mt-1 inline-block w-3.5 h-3.5 rounded-full border-2 shrink-0
					{trigger === option.id ? 'border-primary-500 bg-primary-500' : 'border-surface-400'}"
					aria-hidden="true"
				></span>
				<span>
					<b>{option.name}</b>
					{#if option.id === "thumbnail"}
						<span class="smaller opacity-75">(default)</span>
					{/if}
					<br>
					<span class="opacity-75">{option.description}</span>
				</span>
			</label>
		{/each}
	</div>

	<br>
	<hr />
	<br>

	<div class="text-center">
		{#if armed}
			<button
				class="btn preset-filled-error border border-error-500 text-lg px-6 py-3"
				onclick={disarm}
			>
				Disarm alarm
			</button>
			<div class="mt-3 text-success-400">
				Alarm armed!
				<br>
				Watching for: <b>{selectedOption?.name}</b>
			</div>
			{#if signals[trigger]}
				<div class="smaller opacity-75 mt-1">
					Heads up: that's already the case right now, so the alarm will only fire if it
					happens again
				</div>
			{/if}
		{:else}
			<button
				class="btn preset-filled-success border border-success-500 text-lg px-6 py-3"
				onclick={arm}
			>
				Arm alarm
			</button>
			<div class="mt-3 opacity-75">
				Arming the alarm also enables sound
				<br>
				(browsers block audio until you click something on the page)
			</div>
		{/if}

		<div class="mt-4">
			<button class="btn preset-tonal-surface border border-surface-500" onclick={testAlarm}>
				Test alarm
			</button>
			{#if dev}
				<button
					class="btn preset-tonal-warning border border-warning-500 ml-2"
					onclick={() => fireAlarm(trigger)}
				>
					dev: simulate trigger
				</button>
			{/if}
		</div>
	</div>

	<br>
	<hr />
	<br>

	<h2>Currently watching</h2>

	<div class="card p-3 max-w-2xl mx-auto" aria-live="polite">
		<div class="flex items-center gap-2 flex-wrap">
			{#if details.thumbnailUrl}
				<a href={details.thumbnailUrl} target="_blank" rel="noopener">
					<img
						src={details.thumbnailUrl}
						alt="Current stream thumbnail"
						class="h-20 rounded-lg"
					/>
				</a>
			{/if}
			<div class="grow">
				<div class="flex items-center gap-2">
					<span
						class="inline-block w-3 h-3 rounded-full {signals.thumbnail
							? 'bg-warning-500 animate-pulse'
							: 'bg-surface-600'}"
					></span>
					Thumbnail:
					{#if signals.thumbnail}
						<b class="text-warning-400">uploaded</b>
						{#if thumbnailAgeDisplay}(uploaded {thumbnailAgeDisplay} ago){/if}
					{:else if thumbnailAgeDisplay}
						<span class="opacity-75">last updated {thumbnailAgeDisplay} ago</span>
					{:else}
						<span class="opacity-75">no new thumbnail</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<span
						class="inline-block w-3 h-3 rounded-full {signals.preshow
							? 'bg-success-500 animate-pulse'
							: 'bg-surface-600'}"
					></span>
					Pre-show:
					{#if signals.preshow}
						<b class="text-success-400">LIVE</b>
						{#if formatTime(details.preShowStarted)}(since {formatTime(
								details.preShowStarted
							)}){/if}
					{:else}
						<span class="opacity-75">offline</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<span
						class="inline-block w-3 h-3 rounded-full {signals.mainshow
							? 'bg-success-500 animate-pulse'
							: 'bg-surface-600'}"
					></span>
					Main show:
					{#if signals.mainshow}
						<b class="text-success-400">LIVE</b>
						{#if formatTime(details.mainShowStarted)}(since {formatTime(
								details.mainShowStarted
							)}){/if}
					{:else}
						<span class="opacity-75">offline</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="smaller opacity-75 mt-2">
			Last update: {new Date(lastUpdate).toLocaleTimeString(undefined, {
				hour12: getTimePreference()
			})}
			({Math.floor((nowTick - lastUpdate) / 1e3)}s ago)
			{#if staleConnection}
				<br>
				<span class="text-warning-400">
					Unable to reach Whenplane. Alarms/updates may be delayed.
					The alarm will still fire as soon as a connection succeeds.
				</span>
			{/if}
		</div>
	</div>

	<br>
	<hr />
	<br>

	<div class="opacity-75 smaller max-w-2xl mx-auto">
		Notes:
		<ul class="list-disc list-inside">
			<li>Keep this tab open and your device unmuted</li>
			<li>
				Desktop or laptop recommended, phones/tablets might unload the page after the screen
				locks.
			</li>
			<li>Reloading or navigating away disarms the alarm. You will need to arm it again.</li>
			<li>While armed, the page keeps your screen awake (if your browser supports it).</li>
			<li>
				Looking for alarms that work without keeping a tab open? Try <a
					href="/notifications">push notifications</a
				>
			</li>
		</ul>
	</div>
</div>
<span class="clear">.</span>

{#if alarm}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="alarm-overlay fixed inset-0 z-[1000] flex flex-col items-center justify-center text-center p-4"
		role="alert"
		onclick={overlayClick}
	>
		<h1 class="text-7xl font-bold drop-shadow-lg">WAN ALARM</h1>
		<h2 class="text-4xl font-bold mt-4">{alarmTexts[alarm.trigger]}</h2>
		<div class="text-xl mt-2">
			at {new Date(alarm.at).toLocaleTimeString(undefined, { hour12: getTimePreference() })}
		</div>
		{#if !alarm.sound}
			<div class="mt-4 text-lg font-bold">Tap anywhere to enable the alarm sound</div>
		{/if}
		<button
			class="btn preset-filled-error border border-error-500 text-2xl font-bold px-10 py-5 mt-10"
			onclick={disarm}
		>
			Stop Alarm
		</button>
	</div>
{/if}

<style>
	@reference "#app.css";

	.alarm-overlay {
		animation: alarm-flash 0.75s ease-in-out infinite;
		color: white;
	}

	@keyframes alarm-flash {
		0%,
		100% {
			background-color: rgba(220, 38, 38, 0.96);
		}
		50% {
			background-color: rgba(234, 88, 12, 0.96);
		}
	}

	.smaller {
		font-size: 0.9em;
	}
</style>
