<script context="module" lang="ts">
    import {writable} from "svelte/store";

    const alternates = [
        "late",
        "\"late\"",
        "soon™",
        "close enough",
        "punctually impaired",
        "belated",
        "procrastinated",
        "Linus Late Tips",
        "Late-nus",
        "The Late Show",
        "fashionably late"
    ];

    let current = writable("late");


    setTimeout(() => {
        setInterval(newPhrase, 45e3);
        newPhrase();
    }, 15e3);

    function newPhrase() {
        current.set(alternates[Math.floor(Math.random() * alternates.length)]);
    }
</script>
<span on:click={newPhrase}>
    {$current}
</span>