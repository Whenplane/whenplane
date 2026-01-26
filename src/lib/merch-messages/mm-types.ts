
export type MMTableRow = {
  id: string,
  video: string,
  imageIndex: number,
  type: "message" | "reply",
  name: string,
  text: string,
  jobId: string
}

export type MMV2TableRow = {
  id: string,
  show: string,
  timestamp: number,
  type: "message" | "reply",
  name: string,
  text: string,
  jobId: string,
  position: "TOP" | "BOTTOM"
}

export type MMShow = {
  showId: string,
  status: string,
  title: string,
  releaseDate: number,
  messageCount: number | null,
  replyCount: number | null,
  vodId: string,
  vodSource: "youtube" | "floatplane" | "floatplane-live"
  reader_version: number
}

export type MMVideo = {
  videoId: string,
  status: string,
  title: string,
  releaseDate: number,
  messageCount: number | null
}