<script>
    import Youtube from "./Youtube.svelte";
    import Twitch from "./Twitch.svelte";
</script>

<div class="logo-cloud grid-cols-1 lg:!grid-cols-3 gap-1">
    <a class="logo-item" href="/">
        <span><Twitch/></span>
        <span>
					Twitch<br>
					<span class="status opacity-50">(offline)</span>
				</span>
    </a>
    <a class="logo-item" href="/">
        <span><Youtube/></span>
        <span>
					Youtube<br>
					<span class="status opacity-50">(offline)</span>
				</span>
    </a>
    <a class="logo-item" href="/">
        <span>(icon)</span>
        <span>
					Floatplane<br>
					<span class="status opacity-50">(offline)</span>
				</span>
    </a>
</div>
<style>
    .status {
        font-weight: normal;
        font-size: 0.9em;
    }
    .logo-cloud {
        min-width: 700px;
    }
</style>