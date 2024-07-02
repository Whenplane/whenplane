
export type LatestExchangeRate = {
  result: "success" | "error"
  "error-type"?: string,
  provider: string,
  time_last_update_unix: number,
  time_last_update_utc: string,
  time_next_update_unix: number,
  time_next_update_utc: string,
  time_eol_unix: number,
  base_code: string,
  rates: {
    [key: string]: number
  }
}