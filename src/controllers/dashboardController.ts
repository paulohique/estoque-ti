import { getDashboardData } from "../services/dashboardService";

export async function dashboardController() {
  const data = await getDashboardData();
  return { ok: true, data };
}
