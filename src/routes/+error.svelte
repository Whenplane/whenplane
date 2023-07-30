<script>
    import {page} from "$app/stores";

    let alt = "\"This is Awkward\" - Thumbnail from March 12th, 2021"
</script>

<div class="text-center pt-16">
    <a href="/history/show/2021/03/12" class="inline-block">
        <img src="/this_is_awkward.jpg" {alt} title={alt}/>
    </a>
    <h1>{$page.status}</h1>
    {$page.error.message}
</div>

<style>
    h1 {
        margin-top: 2rem;
    }
    img {
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