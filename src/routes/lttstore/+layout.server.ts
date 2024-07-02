

export const load = (async ({fetch, cookies}) => {
  return {
    exchangeRates: await fetch("/api/exchangeRates").then(r => r.json()),
    currency: cookies.get("currency") ?? "USD"
  }
})