/*
import { topColors } from "@colour-extractor/colour-extractor";
const colors = await topColors('/home/aiden/Downloads/ytdl/not_time.png') as unknown as number[][];
colors.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]))
console.log(colors);*/

import Tesseract from "tesseract.js";

Tesseract.recognize("http://localhost:5173/time-extracting/TXsw_92Y2e0/screenshots/img59.jpg", 'eng')
  .then(r => r.data.text)
  .then(console.log)
