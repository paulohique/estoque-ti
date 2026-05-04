export interface Item {
  id: number;
  name: string;
  category: string;
  sku?: string | null;
  description?: string | null;
  qtyTotal: number;
  qtyMin: number;
  createdAt?: string;
  updatedAt?: string;
}
