<script>
    import {page} from "$app/stores";

    let alt = "\"This is Awkward\" - Thumbnail from March 21st, 2021"
</script>

<div class="text-center">
    <img src="/this_is_awkward.jpg" {alt} title={alt}/>
    <h1>{$page.status}</h1>
    {$page.error.message}
</div>

<style>
    h1 {
        margin-top: 2rem;
    }
    img {
        margin-top: 4rem;
        @apply mx-auto;
        height: 50vh;
    }
    
    @media (max-width: 95vh) {
        img {
            height: auto;
            max-width: 90vw;
        }
    }

    :global(.dark) img {
        background-color: black;
    }
</style>