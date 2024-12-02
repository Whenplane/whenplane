export type Timestamp = {
  time: number,
  timeString: string,
  name: string,
  subTimestamps: Timestamp[]
}

export type TimestampsDbRow = {id: string, videoId: string, time: number, timeString: string, name: string, parent: string | null}


export type YoutubeAutoSubtitles = {
  whenplane?: {
    name: string,
    title: string,
    vods: {
      floatplane?: string,
      youtube: string,
      youtubeParts?: string[]
    },
  }
  events: {
    tStartMs: number,
    durationMs: number,
    id: number,
    segs?: {
      utf8: string,
      tOffsetMs?: number
    }[]
  }[]
}