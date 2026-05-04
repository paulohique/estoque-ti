import { getDashboardData } from "../services/dashboardService";

export async function dashboardController(filters?: {
  dateFrom?: string | null;
  dateTo?: string | null;
  sectorId?: number | null;
  categoryId?: number | null;
}) {
  const data = await getDashboardData(filters);
  return { ok: true, data };
}
