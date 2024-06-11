// from whenplane-lttstore-watcher. Make sure to edit in that repo, then copy here.


export type ShopifyProductsJson = {
  products: ShopifyProduct[]
}

export type ShopifyProduct = {
  id: number,
  title: string,
  handle: string,
  body_html?: string,
  description?: string,
  published_at: string,
  created_at: string,
  updated_at: string,
  vendor: "LTTStore",
  product_type: string,
  tags: string[],
  images: ProductImage[]
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   */
  price?: number,
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   * If this is not null, then this is the "original" price and the regular price property is the discount price
   */
  compare_at_price?: number | null,
  options: ProductOption[],
  variants: ProductVariant[],
  url?: string
}
export type ProductImage = {
  id: number,
  created_at?: string,
  position?: number,
  updated_at?: string,
  product_id?: number,
  src: string,
  width: number,
  height: number
}
export type ProductOption = {
  name: string,
  position: number,
  values: string[]
}

export type ProductVariant = {
  id: number,
  title: string,
  option1: string | null,
  option2: string | null,
  option3: string | null,
  sku: string,
  requires_shipping: boolean,
  taxable: boolean,
  featured_image: string | null,
  available: boolean,
  /**
   * The name of the product with the title of the variant appended
   * e.g. Scribedriver Bolt Action Pen - Stainless
   */
  name: string,
  public_title: string,
  options: string[],
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   */
  price: number,
  weight: number,
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   * If this is not null, then this is the "original" price and the regular price property is the discount price
   */
  compare_at_price?: number | null,
  inventory_management: "shopify",
  featured_media: {
    alt: string | null,
    id: number,
    position: number,
    preview_image: ProductImage
  }
}

export type ProductOptionCombination = {
  name: string;
  options: {
    name: string;
    value: string;
  }[]
}

export type StockCounts = {
  [name: string]: number,
}

export type CartAddErrorResponse = {
  status: number,
  message: string,
  description: string
}
