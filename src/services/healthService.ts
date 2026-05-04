export async function getHealthStatus() {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
