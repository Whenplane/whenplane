export type Timestamp = {
  time: number,
  timeString: string,
  name: string,
  subTimestamps: Timestamp[]
}

export type TimestampsDbRow = {id: string, videoId: string, time: number, timeString: string, name: string, parent: string | null}