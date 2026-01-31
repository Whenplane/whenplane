<script lang="ts">
    import Record from "$lib/history/Record.svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<Record loading={true}>
    {@render children?.()}
</Record>