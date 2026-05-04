import { query } from "../lib/mysql";
import { getRecentMovements } from "./stockMovementRepository";

export type MonthlyOutRow = {
  label: string;
  value: number;
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

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function formatMonthLabel(year: number, month: number) {
  const formatted = monthFormatter.format(new Date(year, month - 1, 1));
  return formatted.replace(".", "").replace(/^\w/, (char) => char.toUpperCase());
}

export async function getDashboardMetrics() {
  const totals = await query<
    Array<{ total_qty: number; distinct_count: number; critical_count: number }>
  >(
    "SELECT SUM(qty_total) AS total_qty, COUNT(*) AS distinct_count, SUM(CASE WHEN qty_total = 0 OR qty_total <= qty_min THEN 1 ELSE 0 END) AS critical_count FROM items",
  );
  const row = totals[0] ?? { total_qty: 0, distinct_count: 0, critical_count: 0 };

  const monthOut = await query<Array<{ out_total: number }>>(
    "SELECT COALESCE(SUM(quantity), 0) AS out_total FROM stock_movements WHERE movement_type = 'out' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())",
  );

  return {
    totalQty: Number(row.total_qty ?? 0),
    distinct: Number(row.distinct_count ?? 0),
    critical: Number(row.critical_count ?? 0),
    outsThisMonth: Number(monthOut[0]?.out_total ?? 0),
  };
}

export async function getMonthlyOuts() {
  const rows = await query<MonthlyOutQueryRow[]>(
    `SELECT
      YEAR(created_at) AS year,
      MONTH(created_at) AS month,
      SUM(quantity) AS value
    FROM stock_movements
    WHERE movement_type = 'out'
      AND created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY YEAR(created_at), MONTH(created_at)`,
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

export async function getMonthComparison() {
  const rows = await query<
    Array<{ current_total: number; previous_total: number }>
  >(
    `SELECT
      COALESCE(SUM(CASE
        WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
        THEN quantity
        ELSE 0
      END), 0) AS current_total,
      COALESCE(SUM(CASE
        WHEN created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
         AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
        THEN quantity
        ELSE 0
      END), 0) AS previous_total
    FROM stock_movements
    WHERE movement_type = 'out'`,
  );
  return {
    current: Number(rows[0]?.current_total ?? 0),
    previous: Number(rows[0]?.previous_total ?? 0),
  };
}

export async function getCategoryDistribution() {
  const rows = await query<CategoryRow[]>(
    `SELECT
      NULLIF(TRIM(category), '') AS category,
      COUNT(*) AS value
    FROM items
    GROUP BY NULLIF(TRIM(category), '')
    ORDER BY value DESC, category ASC`,
  );

  return rows.map((row) => ({
    label: row.category ?? "Sem categoria",
    value: Number(row.value ?? 0),
  }));
}

export async function getRecentDashboardMovements(limit = 5) {
  return getRecentMovements(limit);
}
