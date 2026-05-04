import {
  getCategoryDistribution,
  getDashboardMetrics,
  getMonthComparison,
  getMonthlyOuts,
  getRecentDashboardMovements,
} from "../repositories/dashboardRepository";

export async function getDashboardData() {
  const metrics = await getDashboardMetrics();
  const months = await getMonthlyOuts();
  const comparison = await getMonthComparison();
  const categories = await getCategoryDistribution();
  const recentMovements = await getRecentDashboardMovements();

  return {
    metrics,
    months,
    comparison,
    categories,
    recentMovements,
  };
}
