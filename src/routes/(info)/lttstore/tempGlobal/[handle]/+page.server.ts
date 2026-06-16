import type { StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";
import { error } from "@sveltejs/kit";


export const load = async ({ url, params: {handle}, platform }) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const defaultHistoryDays: number | string = 7;

  let historyDays: number | string = Number(url.searchParams.get("historyDays") ?? defaultHistoryDays);
  let stockHistory: Promise<StockHistoryTableRow[]>;
  if((url.searchParams.get("historyDays") ?? defaultHistoryDays) === "all") {
    historyDays = "all";
    stockHistory = retryD1(() =>
      db.prepare("select timestamp,stock from stock_history where handle = ? and store = 1 order by timestamp")
        .bind(handle)
        .all<StockHistoryTableRow>()
        .then(r => r.results)
    );
  } else {
    stockHistory = retryD1(() =>
      db.prepare("select timestamp,stock from stock_history where handle = ? and store = 1 and timestamp > ? order by timestamp")
        .bind(
          handle,
          Date.now() - ((historyDays as number) * 24 * 60 * 60e3)
        )
        .all<StockHistoryTableRow>()
        .then(r => r.results)
    );
  }

  return {stockHistory: await stockHistory};
};