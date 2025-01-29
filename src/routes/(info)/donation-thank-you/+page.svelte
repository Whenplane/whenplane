<script>
import { page } from "$app/stores";
import HeartFill from "svelte-bootstrap-icons/lib/HeartFill.svelte";
</script>

<ol class="breadcrumb pt-2 pl-2">
  <li class="crumb"><a class="anchor hover-underline" href="/">{$page.url.hostname === "whenwan.show" ? "whenwan.show" : "Whenplane"}</a></li>
  <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
  <li class="crumb">Thank you</li>
</ol>
<div class="limit mx-auto">
  <div class="text-xl text-center" aria-hidden="true">
    <!-- The heart is the wan color (dan said the color code when talking about the new wan hoodie on december 13th 2024) -->
    <HeartFill class="inline-block h-32 w-32" style="color: #b82c25"/>
    <img src="/wan.webp" class=" inline-block h-32 w-32" alt=""/>
  </div>
  <h1>Thank you for your donation!</h1>
  <br>
  Your donation will help ensure that Whenplane will continue being helpful to fans of LTT.<br>
  <br>
  I am currently a college student, so any amount to help with hosting costs is highly appreciated!<br>
  <br>
  <h2>Reminder: I am NOT affiliated with LTT/LMG</h2>
  Whenplane is a side project of a fan, and is not affiliated with or endorsed by LTT/LMG (or any other company for that matter).<br>
  If you donated thinking this was LTT, please <a href="/support">reach out</a> so I can refund you.
</div>