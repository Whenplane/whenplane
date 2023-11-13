<script>
    import LazyLoad from "@dimfeld/svelte-lazyload";
</script>

<LazyLoad style="display: inline-block">
    <div>
        <enhanced:img src="$lib/images/linus.webp" alt="linus face"/>
    </div>
</LazyLoad>
<style>
    div {
        display: inline-block;
        height: 0;
        position: absolute;
        right: 5vw;
    }
    img {
        width: 10em;
        opacity: 20%;
        position: relative;
        bottom: 20rem;
    }
    @media (max-width: 700px) {
        div {
            display: none
        }
    }
</style>