import axios from "axios";
import Instance from "@/models/instance";

const API_BASE_URL = "http://localhost:8080/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const get = async <T>(url: string): Promise<T> => {
  try {
    const response = await apiClient.get<T>(url);
    return response.data;
  } catch (error) {
    console.error("Error get:", error);
    return {} as T;
  }
};

const post = async <T>(url: string, data: object): Promise<T> => {
  try {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  } catch (error) {
    console.error("Error post:", error);
    return {} as T;
  }
};

const put = async <T>(url: string, data: object): Promise<T> => {
  try {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  } catch (error) {
    console.error("Error put:", error);
    return {} as T;
  }
};

export const getCaddyInstances = async (): Promise<Instance[]> => {
  const response = await get<Instance[]>("/instances");
  return response;
};

export const updateCaddyInstance = async (
  instance: Instance
): Promise<Instance> => {
  const response = await put<Instance>("/instances", instance);
  return response;
};

export const addCaddyInstance = async (
  instance: Omit<Instance, "id" | "status">
): Promise<Instance> => {
  const response = await post<Instance>("/instances", instance);
  return response;
};

export const deleteCaddyInstance = async (id: string): Promise<void> => {
  await apiClient.delete(`/instances/${id}`);
};

export const getInstanceStatus = async (id: string): Promise<string> => {
  const response = await get<{ status: string }>(`/instances/${id}/status`);
  return response.status;
};

export const getCaddyConfig = async (id: string): Promise<string> => {
  const response = await get<{ config: string }>(`/instances/${id}/config`);
  return response.config;
};

export const applyCaddyConfig = async (
  id: string,
  config: string
): Promise<void> => {
  await post(`/instances/${id}/config`, { config });
};

export const getCaddyLogs = async (id: string): Promise<string> => {
  const response = await get<{ logs: string }>(`/instances/${id}/logs`);
  return response.logs;
};

export default apiClient;
