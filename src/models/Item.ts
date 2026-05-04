export interface Item {
  id?: number;
  categoryId?: number | null;
  name: string;
  category: string;
  assetTag?: string | null;
  sku?: string | null;
  serialNumber?: string | null;
  description?: string | null;
  responsibleName?: string | null;
  itemStatus?: string;
  locationName?: string | null;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  purchaseDate?: string | null;
  purchaseValue?: number | null;
  imagePath?: string | null;
  qtyTotal: number;
  qtyMin: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
