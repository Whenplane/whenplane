import BackorderAlertDiff from "$lib/lttstore/diff/BackorderAlertDiff.svelte";
import VariantDiff from "$lib/lttstore/diff/VariantDiff.svelte";
import ProductDetailModulesDiff from "$lib/lttstore/diff/ProductDetailModulesDiff.svelte";
import TextWordsDiff from "$lib/lttstore/diff/TextWordsDiff.svelte";
import OptionsDiff from "$lib/lttstore/diff/OptionsDiff.svelte";
import DateDiff from "$lib/lttstore/diff/DateDiff.svelte";
import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";

export function getDiffComponent(field: string) {
  if (field === "backorderAlerts") {
    return BackorderAlertDiff;
  }
  if (field === "product.variants") {
    return VariantDiff;
  }
  if (field === "productDetailModules") {
    return ProductDetailModulesDiff;
  }
  if (field === "product.description") {
   get_diff_component.ts return TextWordsDiff;
  }
  if (field === "product.options") {
    return OptionsDiff;
  }
  if (field === "product.published_at") {
    return DateDiff;
  }
  if (field === "product.type") {
    return TextWordsDiff;
  }
  return TextDiff;
}