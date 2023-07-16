<script>
    import {page} from "$app/stores";
</script>

<div class="text-center">
    <h1>{$page.status}</h1>
    {$page.error.message}
</div>

<style>
    h1 {
        margin-top: 4rem;
    }
</style>