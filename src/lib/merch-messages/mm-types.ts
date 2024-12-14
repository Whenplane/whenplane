
export type MMTableRow = {
  id: string,
  video: string,
  imageIndex: number,
  type: "message" | "reply",
  name: string,
  text: string,
  jobId: string
}

export type MMVideo = {
  videoId: string,
  status: string,
  title: string,
  releaseDate: number,
  messageCount: number | null
}