import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";
import BackorderAlertDiff from "$lib/lttstore/diff/BackorderAlertDiff.svelte";
import VariantDiff from "$lib/lttstore/diff/VariantDiff.svelte";
import ProductDetailModulesDiff from "$lib/lttstore/diff/ProductDetailModulesDiff.svelte";

const field_names: {[key: string]: string} = {
  "product.description": "Product Description",
  "product.available": "In stock?",
  "currentPrice": "Current Price",
  "regularPrice": "Regular Price",
  "title": "Title",
  "backorderAlerts": "Backorder Alerts",
  "product.variants": "Variant Metadata",
  "productDetailModules": "Product Detail Modules",
}

const variant_field_names: {[key: string]: string} = {
  "available": "In stock",
  "title": "Title",
  "featured_image": "Featured Image",
  "weight": "Shipping Weight",
  "Price": "Price",
  "compare_at_price": "Previous Price"
}

export function getFieldName(key: string) {
  return field_names[key] ?? key;
}
export function getVariantFieldName(key: string) {
  return variant_field_names[key] ?? key;
}

export function getDiffComponent(field: string) {
  if(field === "backorderAlerts") {
    return BackorderAlertDiff;
  }
  if(field === "product.variants") {
    return VariantDiff;
  }
  if(field === "productDetailModules") {
    return ProductDetailModulesDiff;
  }
  return TextDiff;
}