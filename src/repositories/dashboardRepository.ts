import { query } from "../lib/mysql";
import { getRecentMovements } from "./stockMovementRepository";

export type MonthlyOutRow = {
  label: string;
  value: number;
};

export type TopMovedItem = {
  itemId: number;
  itemName: string;
  assetTag: string | null;
  category: string;
  movementCount: number;
  totalQuantity: number;
};

export type StaleItem = {
  itemId: number;
  itemName: string;
  assetTag: string | null;
  category: string;
  qtyTotal: number;
  lastOutAt: string | null;
  daysWithoutOut: number | null;
};

export type AssetSectorHistory = {
  itemId: number;
  itemName: string;
  assetTag: string;
  sectorName: string;
  movementType: "out" | "transfer";
  movementCount: number;
  totalQuantity: number;
  lastMovementAt: string;
};

export type DashboardFilters = {
  dateFrom?: string | null;
  dateTo?: string | null;
  sectorId?: number | null;
  categoryId?: number | null;
};

type MonthlyOutQueryRow = {
  year: number;
  month: number;
  value: number;
};

type CategoryRow = {
  category: string | null;
  value: number;
};

type SectorMovementRow = {
  sector_id: number;
  sector_name: string;
  movement_count: number;
  total_quantity: number;
};

type TopMovedItemRow = {
  item_id: number;
  item_name: string;
  asset_tag: string | null;
  category_name: string | null;
  category: string;
  movement_count: number;
  total_quantity: number;
};

type StaleItemRow = {
  item_id: number;
  item_name: string;
  asset_tag: string | null;
  category_name: string | null;
  category: string;
  qty_total: number;
  last_out_at: string | null;
  days_without_out: number | null;
};

type AssetSectorHistoryRow = {
  item_id: number;
  item_name: string;
  asset_tag: string;
  sector_name: string;
  movement_type: "out" | "transfer";
  movement_count: number;
  total_quantity: number;
  last_movement_at: string;
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function formatMonthLabel(year: number, month: number) {
  const formatted = monthFormatter.format(new Date(year, month - 1, 1));
  return formatted.replace(".", "").replace(/^\w/, (char) => char.toUpperCase());
}

function buildItemFilter(filters: DashboardFilters) {
  const conditions = ["i.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (filters.categoryId) {
    conditions.push("i.category_id = ?");
    params.push(filters.categoryId);
  }

  return {
    where: conditions.join(" AND "),
    params,
  };
}

function buildMovementFilter(
  filters: DashboardFilters,
  movementTypes: Array<"in" | "out" | "transfer"> = ["out"],
) {
  const conditions = [
    movementTypes.length === 1
      ? "sm.movement_type = ?"
      : `sm.movement_type IN (${movementTypes.map(() => "?").join(", ")})`,
  ];
  const params: unknown[] = [];
  params.push(...movementTypes);

  if (filters.sectorId) {
    conditions.push("sm.sector_id = ?");
    params.push(filters.sectorId);
  }

  if (filters.categoryId) {
    conditions.push("i.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.dateFrom) {
    conditions.push("DATE(sm.created_at) >= ?");
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push("DATE(sm.created_at) <= ?");
    params.push(filters.dateTo);
  }

  return {
    where: conditions.join(" AND "),
    params,
  };
}

export async function getDashboardMetrics(filters: DashboardFilters = {}) {
  const itemFilter = buildItemFilter(filters);
  const totals = await query<
    Array<{ total_qty: number; distinct_count: number; critical_count: number }>
  >(
    `SELECT
      SUM(i.qty_total) AS total_qty,
      COUNT(*) AS distinct_count,
      SUM(CASE WHEN i.qty_total = 0 OR i.qty_total <= i.qty_min THEN 1 ELSE 0 END) AS critical_count
    FROM items i
    WHERE ${itemFilter.where}`,
    itemFilter.params,
  );
  const row = totals[0] ?? { total_qty: 0, distinct_count: 0, critical_count: 0 };

  const monthFilter = buildMovementFilter(filters);
  const monthOut = await query<Array<{ out_total: number }>>(
    `SELECT COALESCE(SUM(sm.quantity), 0) AS out_total
    FROM stock_movements sm
    INNER JOIN items i ON i.id = sm.item_id
    WHERE ${monthFilter.where}
      AND YEAR(sm.created_at) = YEAR(CURDATE())
      AND MONTH(sm.created_at) = MONTH(CURDATE())`,
    monthFilter.params,
  );

  return {
    totalQty: Number(row.total_qty ?? 0),
    distinct: Number(row.distinct_count ?? 0),
    critical: Number(row.critical_count ?? 0),
    outsThisMonth: Number(monthOut[0]?.out_total ?? 0),
  };
}

export async function getMonthlyOuts(filters: DashboardFilters = {}) {
  const movementFilter = buildMovementFilter(filters);
  const rows = await query<MonthlyOutQueryRow[]>(
    `SELECT
      YEAR(sm.created_at) AS year,
      MONTH(sm.created_at) AS month,
      SUM(sm.quantity) AS value
    FROM stock_movements sm
    INNER JOIN items i ON i.id = sm.item_id
    WHERE ${movementFilter.where}
      AND sm.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
    GROUP BY YEAR(sm.created_at), MONTH(sm.created_at)
    ORDER BY YEAR(sm.created_at), MONTH(sm.created_at)`,
    movementFilter.params,
  );

  const rowsByKey = new Map(
    rows.map((row) => [`${row.year}-${row.month}`, Number(row.value ?? 0)]),
  );
  const result: MonthlyOutRow[] = [];
  const currentDate = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = rowsByKey.get(`${year}-${month}`) ?? 0;

    result.push({
      label: formatMonthLabel(year, month),
      value,
    });
  }

  return result;
}

export async function getMonthComparison(filters: DashboardFilters = {}) {
  const movementFilter = buildMovementFilter(filters);
  const rows = await query<
    Array<{ current_total: number; previous_total: number }>
  >(
    `SELECT
      COALESCE(SUM(CASE
        WHEN sm.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND sm.created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
        THEN sm.quantity
        ELSE 0
      END), 0) AS current_total,
      COALESCE(SUM(CASE
        WHEN sm.created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
         AND sm.created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
        THEN sm.quantity
        ELSE 0
      END), 0) AS previous_total
    FROM stock_movements sm
    INNER JOIN items i ON i.id = sm.item_id
    WHERE ${movementFilter.where}`,
    movementFilter.params,
  );
  return {
    current: Number(rows[0]?.current_total ?? 0),
    previous: Number(rows[0]?.previous_total ?? 0),
  };
}

export async function getCategoryDistribution(filters: DashboardFilters = {}) {
  const itemFilter = buildItemFilter(filters);
  const rows = await query<CategoryRow[]>(
    `SELECT
      NULLIF(TRIM(COALESCE(c.name, i.category)), '') AS category,
      COUNT(*) AS value
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE ${itemFilter.where}
    GROUP BY NULLIF(TRIM(COALESCE(c.name, i.category)), '')
    ORDER BY value DESC, category ASC`,
    itemFilter.params,
  );

  return rows.map((row) => ({
    label: row.category ?? "Sem categoria",
    value: Number(row.value ?? 0),
  }));
}

export async function getRecentDashboardMovements(limit = 5) {
  return getRecentMovements(limit);
}

export async function getSectorMovementStats(filters: DashboardFilters = {}) {
  const movementFilter = buildMovementFilter(filters, ["out", "transfer"]);
  const rows = await query<SectorMovementRow[]>(
    `SELECT
      s.id AS sector_id,
      s.name AS sector_name,
      COUNT(sm.id) AS movement_count,
      COALESCE(SUM(sm.quantity), 0) AS total_quantity
    FROM sectors s
    LEFT JOIN stock_movements sm
      ON sm.sector_id = s.id
    LEFT JOIN items i
      ON i.id = sm.item_id
    WHERE s.deleted_at IS NULL
      AND (sm.id IS NULL OR (${movementFilter.where}))
    GROUP BY s.id, s.name
    ORDER BY total_quantity DESC, s.name ASC`,
    movementFilter.params,
  );

  return rows.map((row) => ({
    sectorId: row.sector_id,
    sectorName: row.sector_name,
    movementCount: Number(row.movement_count ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
  }));
}

export async function getTopMovedItems(filters: DashboardFilters = {}, limit = 5) {
  const movementFilter = buildMovementFilter(filters);
  const rows = await query<TopMovedItemRow[]>(
    `SELECT
      i.id AS item_id,
      i.name AS item_name,
      i.asset_tag,
      c.name AS category_name,
      i.category,
      COUNT(sm.id) AS movement_count,
      COALESCE(SUM(sm.quantity), 0) AS total_quantity
    FROM stock_movements sm
    INNER JOIN items i ON i.id = sm.item_id
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE ${movementFilter.where}
    GROUP BY i.id, i.name, i.asset_tag, c.name, i.category
    ORDER BY total_quantity DESC, movement_count DESC, i.name ASC
    LIMIT ?`,
    [...movementFilter.params, limit],
  );

  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    assetTag: row.asset_tag,
    category: row.category_name ?? row.category ?? "Sem categoria",
    movementCount: Number(row.movement_count ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
  }));
}

export async function getStaleItems(filters: DashboardFilters = {}, limit = 5) {
  const itemFilter = buildItemFilter(filters);
  const rows = await query<StaleItemRow[]>(
    `SELECT
      i.id AS item_id,
      i.name AS item_name,
      i.asset_tag,
      c.name AS category_name,
      i.category,
      i.qty_total,
      MAX(CASE WHEN sm.movement_type = 'out' THEN sm.created_at ELSE NULL END) AS last_out_at,
      CASE
        WHEN MAX(CASE WHEN sm.movement_type = 'out' THEN sm.created_at ELSE NULL END) IS NULL THEN NULL
        ELSE DATEDIFF(CURDATE(), DATE(MAX(CASE WHEN sm.movement_type = 'out' THEN sm.created_at ELSE NULL END)))
      END AS days_without_out
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    LEFT JOIN stock_movements sm ON sm.item_id = i.id
    WHERE ${itemFilter.where}
    GROUP BY i.id, i.name, i.asset_tag, c.name, i.category, i.qty_total
    ORDER BY
      CASE WHEN last_out_at IS NULL THEN 0 ELSE 1 END ASC,
      days_without_out DESC,
      i.updated_at ASC
    LIMIT ?`,
    [...itemFilter.params, limit],
  );

  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    assetTag: row.asset_tag,
    category: row.category_name ?? row.category ?? "Sem categoria",
    qtyTotal: Number(row.qty_total ?? 0),
    lastOutAt: row.last_out_at,
    daysWithoutOut:
      row.days_without_out == null ? null : Number(row.days_without_out),
  }));
}

export async function getAssetSectorHistory(filters: DashboardFilters = {}, limit = 8) {
  const movementFilter = buildMovementFilter(filters, ["out", "transfer"]);
  const rows = await query<AssetSectorHistoryRow[]>(
    `SELECT
      i.id AS item_id,
      i.name AS item_name,
      i.asset_tag,
      s.name AS sector_name,
      sm.movement_type,
      COUNT(sm.id) AS movement_count,
      COALESCE(SUM(sm.quantity), 0) AS total_quantity,
      MAX(sm.created_at) AS last_movement_at
    FROM stock_movements sm
    INNER JOIN items i ON i.id = sm.item_id
    INNER JOIN sectors s ON s.id = sm.sector_id
    WHERE ${movementFilter.where}
      AND i.asset_tag IS NOT NULL
      AND TRIM(i.asset_tag) <> ''
    GROUP BY i.id, i.name, i.asset_tag, s.name, sm.movement_type
    ORDER BY last_movement_at DESC, i.name ASC
    LIMIT ?`,
    [...movementFilter.params, limit],
  );

  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    assetTag: row.asset_tag,
    sectorName: row.sector_name,
    movementType: row.movement_type,
    movementCount: Number(row.movement_count ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
    lastMovementAt: row.last_movement_at,
  }));
}
