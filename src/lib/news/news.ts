import type { IOptions } from "sanitize-html";
import sanitizeHtml from "sanitize-html";

export const newsSanitizeSettings: IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'video', 'source' ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: sanitizeHtml.defaults.allowedAttributes.a.concat([
      "target",
      {
        name: "rel",
        multiple: false,
        values: ["noreferer", "noopener"]
      }
    ]),
    img: sanitizeHtml.defaults.allowedAttributes.img.concat([ 'class' ]),
    video: [ "width", "height", "autoplay", "controls" ],
    source: ["src", "type"]
  }
}

export type NewsPost = {
  timestamp: number,
  url: string,
  title: string,
  body: string
}

export const first_news_post = [
  "1702149714624", //"2023-12-09T19:14:26.152Z",
  "whenplane-is-in-an-ltt-video",
  "Whenplane is in an LTT video!",
  `Unfortunately, it wasn't mentioned at all, but is in the background.<br>
<img src="https://images.ajg0702.us/whenplane_on_ltt.jpg">
(<a href="https://youtu.be/QGcYUtNIrRw?t=1369" target="_blank" rel="noopener">Youtube</a> | <a href="https://www.floatplane.com/post/DpnlYlWQv8" target="_blank" rel="noopener">Floatplane</a> @ 22:49)<br>
<img src="https://images.ajg0702.us/whenplane_zoomed.png">
This was recorded just before the show on <a href="https://whenplane.com/history/show/2023/11/03">November 3rd, 2023</a>.<br>
<br>
Linus was hosting a LAN party at his house, where just under 100 people (including LMG staff and others) showed up.
Due to all of the excitement, the WAN show was a bit late (although not much more than usual). Apparently, one of the attendees was into the wan show, or at least tracking how late it was, so they decided to pull up Whenplane.<br>
<br>
Whoever this person is, thank you for making my morning WAY when the video was published.
<img src="https://images.ajg0702.us/thank_you_person.png">`
]