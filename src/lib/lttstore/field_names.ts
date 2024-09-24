import TextDiff from "$lib/lttstore/diff/TextDiff.svelte";

const field_names: {[key: string]: string} = {
  "product.description": "Product Description"
}

export function getFieldName(key: string) {
  return field_names[key] ?? key;
}

export function getDiffComponent() {
  return TextDiff;
}