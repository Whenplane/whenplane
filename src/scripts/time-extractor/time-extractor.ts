import util from "util";
import {exec as execCallback} from "child_process";
import fs from "node:fs/promises";
import { fileExists } from "../old-history-generator/utils";

const exec = util.promisify(execCallback);

export async function download(id: string) {
  if(await fileExists(`static/time-extracting/${id}/vid.mp4`)) {
    return {}
  }
  console.log(1)
  await fs.mkdir("static/time-extracting/" + id, {recursive: true});
  console.log(2);
  return new Promise<object>((resolve, reject) => {
    const dl = execCallback(`youtube-dl --exec "ffmpeg -init_hw_device vaapi=foo:/dev/dri/renderD128 -hwaccel vaapi -hwaccel_device foo -i {} -filter:v \\"crop=150:45:in_w-150:in_h-45\\" tmp.mp4 && mv tmp.mp4 vid.mp4 && rm {}" ${id}`, {
      cwd: "static/time-extracting/" + id
    })
    dl.stdout?.on('data', data => {
      console.log("[dl stdout] " + data.toString())
    })
    dl.on("exit", code => {
      console.log(3)
      if(code == 0) {
        resolve({});
      } else {
        reject("Download command returned code " + code);
      }
    })
    console.log(2.5)
  })
}

export async function process(id: string) {
  if(await fileExists(`static/time-extracting/${id}/screenshots/img1.jpg`)) {
    return {}
  }
  console.log(4)
  await fs.mkdir(`static/time-extracting/${id}/screenshots`);
  console.log(5)
  const out = await exec(`ffmpeg -i vid.mp4 -vf fps=1/60 screenshots/img%d.jpg`, {
    cwd: "static/time-extracting/" + id
  })
  console.log(6)
  return {};
}