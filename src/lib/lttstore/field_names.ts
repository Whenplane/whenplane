import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";
import BackorderAlertDiff from "$lib/lttstore/diff/BackorderAlertDiff.svelte";

const field_names: {[key: string]: string} = {
  "product.description": "Product Description",
  "product.available": "In stock?",
  "currentPrice": "Current Price",
  "regularPrice": "Regular Price",
  "title": "Title",
  "backorderAlerts": "Backorder Alerts"
}

export function getFieldName(key: string) {
  return field_names[key] ?? key;
}

export function getDiffComponent(field: string) {
  if(field === "backorderAlerts") {
    return BackorderAlertDiff;
  }
  return TextDiff;
}