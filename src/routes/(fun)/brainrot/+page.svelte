<script lang="ts">
  import { browser } from "$app/environment";

  const aiName = "AI server-side"

  const allVoicesObtained = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    if(browser) {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length !== 0) {
        resolve(voices);
      } else {
        window.speechSynthesis.addEventListener("voiceschanged", function() {
          voices = window.speechSynthesis.getVoices();
          resolve(voices);
        });
      }
    }
  }).then(v => {v.unshift({name: aiName, lang: "en"} as unknown as SpeechSynthesisVoice); return v;});

  let langFilter = $state("en");
  let localOnly = $state(false);
  let text = $state("The quick brown fox jumps over the lazy dog.");
  let audio: string | undefined = $state(undefined)

  allVoicesObtained.then(voices => console.debug("All voices:", voices));

  async function speak(voiceName: string) {
    audio = undefined;
    if(voiceName === aiName) {
      const response = await fetch("https://workers-ai-tts.ajg.workers.dev/gen?t=" + encodeURIComponent(text), {
        method: "POST"
      }).then(r => r.json());
      if(!response.audio) {
        console.error("Response does not have audio!", response)
        return;
      }
      console.debug("Playing response:", response);
      audio = response.audio;
      // let sound = new Audio("data:audio/wav;base64," + response.audio);
      // await sound.play();
      return;
    }
    const voices = await allVoicesObtained;
    const voice = voices.find(v => v.name === voiceName);
    if(!voice) {
      console.error("Could not find voice", voiceName)
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;

    window.speechSynthesis.speak(utterance)
  }
</script>
<div class="limit mx-auto p-2">
  <h1>Brainrot generator</h1>

  {#await allVoicesObtained}
    Loading voices..
  {:then voices}
    {#if audio}
      <audio controls autoplay src={"data:audio/wav;base64," + audio}></audio>
    {/if}
    <input class="input" bind:value={text}><br>
    <select bind:value={langFilter} class="input w-64">
      {#each [
        "",
        ...(voices.map(v => v.lang).includes("en") ? [] : ["en"]),
        ...[...new Set(voices.map(v => v.lang))].filter(l => l.startsWith("en")),
        ...[...new Set(voices.map(v => v.lang))].filter(l => !l.startsWith("en")).sort()
      ] as lang}
        <option value={lang}>{lang === "" ? "[no language filter]" : lang}</option>
      {/each}
    </select>
    <input type="checkbox" bind:checked={localOnly}/>
    <br>
    {#each voices.filter(v => v.lang.startsWith(langFilter) && (localOnly ? v.localService : true)).sort((a, b) => a.name.localeCompare(b.name)) as voice}
      <button onclick={() => speak(voice.name)}>
        {voice.name}
      </button>
      <br>
    {:else}
      Your browser has no voices that match the filters above
    {/each}
  {/await}
</div>