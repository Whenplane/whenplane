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
  vendor: "LTTStore" | "Linus Tech Tips Store",
  product_type: string,
  tags: string[],
  images: ProductImage[],
  featured_image?: string
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
  url?: string,
  /** available as in in-stock */
  available: boolean
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
  [name: string]: number
} & {total?: number}

export type CartAddErrorResponse = {
  status: number,
  message: string,
  description: string
}


export type ProductsTableRow = {
  handle: string,
  id: number,
  title: string,
  product: string,
  stock: string,
  stockChecked: number,
  lastRestock: number,
  purchasesPerHour: number,
  purchasesPerDay: number,
  regularPrice: number,
  currentPrice: number,
  firstSeen: number,
  available: boolean,
  backorderAlerts: string
}
export type ParsedProductsTableRow = {
  handle: string,
  id: number,
  title: string,
  product: ShopifyProduct,
  stock?: StockCounts,
  stockChecked?: number,
  lastRestock?: number,
  purchasesPerHour?: number,
  purchasesPerDay?: number,
  regularPrice?: number,
  currentPrice: number,
  firstSeen?: number,
  available: boolean,
  backorderAlerts: BackorderAlerts
}

export type StockHistoryTableRow = {
  handle: string,
  id: number,
  timestamp: number,
  stock: string
}

export type BackorderAlerts = {
  /** The key is the variant id, the value is the message */
  [variant_id: string]: string
}

export type ProductDifference<Type = unknown> = {
  key: string,
  before: Type,
  after: Type
}
