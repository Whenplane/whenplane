
export type MMTableRow = {
  id: string,
  video: string,
  imageIndex: number,
  type: "message" | "reply",
  name: string,
  text: string,
  jobId: string
}