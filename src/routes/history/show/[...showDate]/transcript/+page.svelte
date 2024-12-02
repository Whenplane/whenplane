<script lang="ts">
  export let data;

  let text = "";
  for (let event of data.transcript.events) {
    if(!event.segs) continue;
    for (let seg of event.segs) {
      if(!seg.utf8) continue;
      text += seg.utf8;
    }
  }
</script>
{text}