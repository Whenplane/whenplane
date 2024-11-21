export type CombinedSearchResult =
  { // timestamp/topic
    type: "topic",
    id: string,
    videoId: string,
    time: number,
    timeString: string,
    text: string,
    name: string,
    parent: string | null,
    showDate: number,
    sortWeight: number
  } |
  { // merch message
    id: string,
    videoId: string,
    imageIndex: number,
    type: "message" | "reply",
    name: string,
    text: string,
    jobId: string,
    showDate: number,
    sortWeight: number
  } | { // show titles
    type: "title",
    id: string,
    text: string,
    showName: string,
    videoId: string,
    showDate: number,
    sortWeight: number
  } | { // show transcripts
    type: "transcript",
    text: string,
    videoId: string,
    id: string,
    showName: string,
    showDate: number,
    sortWeight: number
  }