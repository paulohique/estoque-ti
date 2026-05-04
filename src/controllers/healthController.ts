import { getHealthStatus } from "../services/healthService";

export async function getHealth() {
  return getHealthStatus();
}
