import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";
import BackorderAlertDiff from "$lib/lttstore/diff/BackorderAlertDiff.svelte";
import VariantDiff from "$lib/lttstore/diff/VariantDiff.svelte";
import ProductDetailModulesDiff from "$lib/lttstore/diff/ProductDetailModulesDiff.svelte";
import TextWordsDiff from "$lib/lttstore/diff/TextWordsDiff.svelte";
import OptionsDiff from "$lib/lttstore/diff/OptionsDiff.svelte";
import DateDiff from "$lib/lttstore/diff/DateDiff.svelte";

const field_names: {[key: string]: string} = {
  "currentPrice": "Current Price",
  "regularPrice": "Regular Price",
  "title": "Title",
  "backorderAlerts": "Backorder Alerts",
  "productDetailModules": "Product Detail Modules",
  "available": "Published",

  "product.description": "Product Description",
  "product.available": "In stock?",
  "product.variants": "Variant Metadata",
  "product.options": "Options",
  "product.published_at": "Published",
  "product.type": "Product Type"
}

const variant_field_names: {[key: string]: string} = {
  "available": "In stock",
  "title": "Title",
  "featured_image": "Featured Image",
  "featured_media": "Featured Media",
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
  if(field === "product.description") {
    return TextWordsDiff;
  }
  if(field === "product.options") {
    return OptionsDiff;
  }
  if(field === "product.published_at") {
    return DateDiff;
  }
  if(field === "product.type") {
    return TextWordsDiff;
  }
  return TextDiff;
}