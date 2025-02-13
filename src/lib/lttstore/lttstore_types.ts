// from whenplane-lttstore-watcher. Make sure to edit in that repo, then copy here.


export type ShopifyProductsJson = {
  products: LegacyShopifyProduct[]
}

/**
 * for product data from /products/{handle}.js
 */
export type ShopifyProduct = {
  id: number,
  title: string,
  handle: string,
  description: string,
  published_at: string,
  created_at: string,
  vendor: "LTTStore" | "Linus Tech Tips Store",
  product_type: string,
  type: string,
  tags: string[],
  images: string[],
  featured_image: string
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   */
  price: number,
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   * If this is not null, then this is the "original" price and the regular price property is the discount price
   */
  compare_at_price: number | null,
  options: ProductOption[],
  variants: ProductVariant[],
  url: string,
  /** available as in in-stock */
  available: boolean,
  requires_selling_plan: boolean,
  selling_plan_groups: unknown[]
}

/**
 * from products.json
 */
export type LegacyShopifyProduct = {
  id: number,
  title: string,
  handle: string,
  body_html?: string,
  published_at: string,
  created_at: string,
  updated_at: string,
  vendor: "LTTStore" | "Linus Tech Tips Store",
  product_type: string,
  tags: string[],
  images: ProductImage[],
  options: ProductOption[],
  variants: LegacyProductVariant[]
}


export type ProductImage = {
  id?: number,
  created_at?: string,
  position?: number,
  updated_at?: string,
  product_id?: number,
  aspect_ratio?: number,
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
  /** available as in in-stock */
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
  /** in grams (I think. I got this because this field is called 'grams' in legacy) */
  weight: number,
  /**
   * For some reason the decimal is missing in this number, so it needs to be divided by 100
   * If this is not null, then this is the "original" price and the regular price property is the discount price
   */
  compare_at_price?: number | null,
  inventory_management: "shopify",
  barcode: string,
  quantity_rule: {
    min: number,
    max: number | null,
    increment: number
  }
  featured_media?: {
    alt: string | null,
    id: number,
    position: number,
    preview_image: ProductImage
  }
  quantity_price_breaks: unknown[],
  requires_selling_plan: boolean,
  selling_plan_allocations: unknown[]
}

export type LegacyProductVariant = {
  id: number,
  title: string,
  option1: string | null,
  option2: string | null,
  option3: string | null,
  sku: string,
  requires_shipping: boolean,
  taxable: boolean,
  featured_image: string | null,
  /** available as in in-stock */
  available: boolean,
  price: number,
  grams: number,
  compare_at_price: number | null,
  position: number,
  product_id: number,
  created_at: string,
  updated_at: string,
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
  backorderAlerts: string,
  productDetailModules: string,
  productDiscount: string
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
  backorderAlerts: BackorderAlerts,
  productDetailModules: ProductDetailModule[],
  productDiscount: string[]
}

export type SimilarProductsTableRow = {
  id: number,
  hash: string,
  handle: string,
  timestamp: number,
  similar: string
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

export type ProductDetailModule = {
  title: string,
  content: string
}


export type ProductSearchIndex = {
  id: string,
  handle: string,
  title: string,
  product: string,
  description: string,
  productType: string,
  tags: string[],
  totalStock: number,
  stockChecked: number,
  lastRestock: number,
  purchasesPerHour: number,
  purchasesPerDay: number,
  regularPrice: number,
  currentPrice: number,
  firstSeen: number,
  available: boolean
}



export type ShopifyCollection = {
  id: number,
  title: string,
  handle: string,
  description: string,
  published_at: string,
  updated_at: string,
  image: CollectionImage | null,
  products_count: number
}
export type CollectionImage = {
  id: number,
  created_at: string,
  src: string,
  alt: string | null
}

export type CollectionDbRow = {
  id: number,
  title: string,
  handle: string,
  description: string,
  published_at: number,
  updated_at: number,
  image: string | null,
  reportedCount: number,
  products: string,
  available: boolean
}
