export interface Item {
  id?: number;
  name: string;
  category: string;
  assetTag?: string | null;
  sku?: string | null;
  description?: string | null;
  imagePath?: string | null;
  qtyTotal: number;
  qtyMin: number;
  createdAt?: string;
  updatedAt?: string;
}
