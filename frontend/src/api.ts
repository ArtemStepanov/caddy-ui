import axios from "axios";
import Instance from "./models/instance";

const API_BASE_URL = "http://localhost:8080/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getCaddyInstances = async (): Promise<Instance[]> => {
  try {
    const response = await apiClient.get("/instances");
    return response.data as Instance[];
  } catch (error) {
    console.error("Error fetching Caddy instances:", error);
    throw error;
  }
};

export const addCaddyInstance = async (
  instance: Omit<Instance, "id">
): Promise<Instance> => {
  const response = await apiClient.post("/instances", instance);
  return response.data as Instance;
};

export const deleteCaddyInstance = async (id: string): Promise<void> => {
  await apiClient.delete(`/instances/${id}`);
};

export const getInstanceStatus = async (id: string): Promise<string> => {
  const response = await apiClient.get(`/instances/${id}/status`);
  const data = response.data as { status: string };
  return data.status;
};

export const getCaddyConfig = async (id: string): Promise<string> => {
  const response = await apiClient.get<{ config: string }>(
    `/instances/${id}/config`
  );
  return response.data.config;
};

export const applyCaddyConfig = async (
  id: string,
  config: string
): Promise<void> => {
  await apiClient.post(`/instances/${id}/config`, { config });
};

export const getCaddyLogs = async (id: string): Promise<string> => {
  const response = await apiClient.get<{ logs: string }>(
    `/instances/${id}/logs`
  );
  return response.data.logs;
};

export default apiClient;
