import { apiGet } from "./client"

export async function getSystemStatus() {
  return apiGet("/status")
}
