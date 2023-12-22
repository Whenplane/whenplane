export const options: LatenessVotingOption[] = [
  {
    name: "Early",
    comment: "funny joke",
    votes: 0,
    time: 0
  },
  {
    name: "On time",
    comment: "if only, right?",
    votes: 0,
    time: 5 * 60e3
  },
  {
    name: "~30 minutes late",
    votes: 0,
    time: 50 * 60e3
  },
  {
    name: "1 hour late",
    votes: 0,
    time: 1.75 * 60 * 60e3
  },
  {
    name: "2-3 hours late",
    votes: 0,
    time: 3.75 * 60 * 60e3
  },
  {
    name: "4+ hours late",
    comment: "new record?",
    votes: 0,
    time: 24 * 60 * 60e3
  }
];

// How long a vote lasts (48 hours)
export const vote_valid_for = 48 * 60 * 60e3;


export type LatenessVotingOption = {
  name: string,
  comment?: string,
  votes: number,
  time: number
}

export type UserVote = {
  lastVote: number,
  lastVoteFor?: string
}