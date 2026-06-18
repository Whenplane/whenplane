import { redirect } from "@sveltejs/kit";


export const load = (async ({params, url}) => {
  if(!["us", "global"].includes(params.store.toLowerCase())) {
    const newUrl = new URL(url);
    if(url.pathname.includes("tempGlobal")) {
      newUrl.pathname = newUrl.pathname.replaceAll("tempGlobal", "global/products");
    } else {
      newUrl.pathname = newUrl.pathname.replace(/^\/lttstore/, "/lttstore/us");
      throw redirect(302, newUrl)
    }
  }
})