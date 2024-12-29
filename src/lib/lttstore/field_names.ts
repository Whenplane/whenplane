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
  "product.type": "Product Type",

  "collection-updated_at": "Updated Timestamp",
  "collection-products": "Products",
  "collection-available": "Published",
  "collection-reportedCount": "Reported Product Count",
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
  return field_names[key] ?? key.replace("collection-", "");
}
export function getVariantFieldName(key: string) {
  return variant_field_names[key] ?? key;
}

