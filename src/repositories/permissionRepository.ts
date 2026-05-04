export async function getUserPermissionOverrides(
  _userId: number,
): Promise<Array<{ code: string; allowed: boolean }>> {
  // Implementar com MySQL.
  return [];
}
