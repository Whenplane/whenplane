import { redirect } from "@sveltejs/kit";
import { getStoreMetadata, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";


export const load = (async ({params, url, fetch, cookies}) => {
  const storeId = storeIdFromName(params.store);
  if(storeId === -1) {
    const newUrl = new URL(url);
    if(url.pathname.includes("tempGlobal")) {
      newUrl.pathname = newUrl.pathname.replaceAll("tempGlobal", "global/products");
    } else {
      newUrl.pathname = newUrl.pathname.replace(/^\/lttstore/, "/lttstore/us");
      throw redirect(302, newUrl)
    }
  }

  return {
    exchangeRates: await fetch("/api/exchangeRates").then(r => r.json()),
    currency: cookies.get("currency") ?? "USD",
    store: {
      id: storeId,
      ...getStoreMetadata(storeId)
    }
  }
})