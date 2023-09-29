export const options: LatenessVotingOption[] = [
  {
    name: "Early",
    comment: "funny joke",
    votes: 0
  },
  {
    name: "On time",
    comment: "if only, right?",
    votes: 0
  },
  {
    name: "~30 minutes late",
    votes: 0
  },
  {
    name: "1-2 hours late",
    votes: 0
  },
  {
    name: "3-4 hours late",
    votes: 0
  },
  {
    name: "5+ hours late",
    comment: "new record?",
    votes: 0
  }
];

// How long a vote lasts (48 hours)
export const vote_valid_for = 48 * 60 * 60e3;


export type LatenessVotingOption = {
  name: string,
  comment?: string,
  votes: number
}

export type UserVote = {
  lastVote: number,
  lastVoteFor?: string
}