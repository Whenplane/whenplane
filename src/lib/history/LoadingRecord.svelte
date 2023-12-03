<script>
    import Record from "$lib/history/Record.svelte";
</script>

<Record loading={true}>
    <slot/>
</Record>