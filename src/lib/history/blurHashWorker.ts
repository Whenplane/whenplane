import { decodeBlurHash } from 'fast-blurhash';


addEventListener("message", (e: MessageEvent<{id: string, hash: string, w: number, h: number}>) => {
  const pixels = decodeBlurHash(e.data.hash, e.data.w, e.data.h);
  postMessage({id: e.data.id, data: pixels.buffer}, { transfer: [pixels.buffer] })
})