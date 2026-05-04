import {
  getCategoryDistribution,
  getDashboardMetrics,
  getMonthComparison,
  getMonthlyOuts,
  getRecentDashboardMovements,
  getSectorMovementStats,
} from "../repositories/dashboardRepository";

export async function getDashboardData() {
  const metrics = await getDashboardMetrics();
  const months = await getMonthlyOuts();
  const comparison = await getMonthComparison();
  const categories = await getCategoryDistribution();
  const recentMovements = await getRecentDashboardMovements();
  const sectorMovements = await getSectorMovementStats();

  return {
    metrics,
    months,
    comparison,
    categories,
    recentMovements,
    sectorMovements,
  };
}
