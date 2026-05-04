import {
  getAssetSectorHistory,
  type DashboardFilters,
  getCategoryDistribution,
  getDashboardMetrics,
  getMonthComparison,
  getMonthlyOuts,
  getRecentDashboardMovements,
  getSectorMovementStats,
  getStaleItems,
  getTopMovedItems,
} from "../repositories/dashboardRepository";

export async function getDashboardData(filters: DashboardFilters = {}) {
  const metrics = await getDashboardMetrics(filters);
  const months = await getMonthlyOuts(filters);
  const comparison = await getMonthComparison(filters);
  const categories = await getCategoryDistribution(filters);
  const recentMovements = await getRecentDashboardMovements();
  const sectorMovements = await getSectorMovementStats(filters);
  const topMovedItems = await getTopMovedItems(filters);
  const staleItems = await getStaleItems(filters);
  const assetHistory = await getAssetSectorHistory(filters);

  return {
    metrics,
    months,
    comparison,
    categories,
    recentMovements,
    sectorMovements,
    topMovedItems,
    staleItems,
    assetHistory,
  };
}
