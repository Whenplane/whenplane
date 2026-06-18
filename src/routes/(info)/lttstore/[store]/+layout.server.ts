import { redirect } from "@sveltejs/kit";


export const load = (async ({params, url, fetch, cookies}) => {
  if(!["us", "global"].includes(params.store.toLowerCase())) {
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
    currency: cookies.get("currency") ?? "USD"
  }
})