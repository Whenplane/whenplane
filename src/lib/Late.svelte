<script context="module" lang="ts">
    import {get, writable} from "svelte/store";
    import {browser} from "$app/environment";

    const alternates = [
        "late",
        "\"late\"",
        "soon™",
        "close enough",
        "punctually impaired",
        "punctually challenged",
        "belated",
        "procrastinated",
        "Linus Late Tips",
        "Late-nus",
        "The Late Show",
        "fashionably late",
        "tardy",
        "diligently delayed"
    ];

    let current = writable("late");


    if(browser) {
        setTimeout(() => {
            setInterval(newPhrase, 45e3);
            newPhrase();
        }, 15e3);
    }

    function newPhrase() {
        const skip = localStorage.getItem("no-special-late-text") === "true";
        if(skip && get(current) != "late") {
            current.set("late");
            return;
        } else if(skip) {
            return;
        }
        current.set(alternates[Math.floor(Math.random() * alternates.length)]);
    }
</script>
<span on:click={newPhrase}>
    {$current}
</span>