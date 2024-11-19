export type CombinedSearchResult =
  { // timestamp/topic
    type: "topic",
    id: string,
    videoId: string,
    time: number,
    timeString: string,
    text: string,
    name: string,
    parent: string | null
  } |
  { // merch message
    id: string,
    video: string,
    imageIndex: number,
    type: "message" | "reply",
    name: string,
    text: string,
    jobId: string
  } | { // show titles
  type: "title",
  text: string,
} | { // show transcripts
  type: "transcript",
  text: string,
  videoId: string,
  showName: string
}