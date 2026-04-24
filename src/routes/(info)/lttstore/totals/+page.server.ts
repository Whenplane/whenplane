import type { StockTotalsRow } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";


export const load: PageServerLoad = async ({ url, platform }) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const defaultHistoryDays: number | string = 7;

  let historyDays: number | string = Number(url.searchParams.get("historyDays") ?? defaultHistoryDays);
  let stockHistory: Promise<StockTotalsRow[]>;
  if((url.searchParams.get("historyDays") ?? defaultHistoryDays) === "all") {
    historyDays = "all";
    stockHistory = retryD1(() =>
      db.prepare("select * from stock_totals order by timestamp")
        .all<StockTotalsRow>()
        .then(r => r.results)
    );
  } else {
    stockHistory = retryD1(() =>
      db.prepare("select * from stock_totals where timestamp > ? order by timestamp")
        .bind(
          Date.now() - ((historyDays as number) * 24 * 60 * 60e3)
        )
        .all<StockTotalsRow>()
        .then(r => r.results)
    );
  }

  return {totalsHistory: await stockHistory};
};