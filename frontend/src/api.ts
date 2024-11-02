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
    throw error;
  }
};

export default class Api {
  public static getCaddyInstances = async (): Promise<Instance[]> => {
    return await get<Instance[]>("/instances");
  };

  public static updateCaddyInstance = async (
    instance: Instance,
  ): Promise<Instance> => {
    return await put<Instance>("/instances", instance);
  };

  public static addCaddyInstance = async (
    instance: Omit<Instance, "id" | "status">,
  ): Promise<Instance> => {
    return await post<Instance>("/instances", instance);
  };

  public static deleteCaddyInstance = async (id: string): Promise<void> => {
    await apiClient.delete(`/instances/${id}`);
  };

  public static getInstanceStatus = async (id: string): Promise<string> => {
    const response = await get<{ status: string }>(`/instances/${id}/status`);
    return response.status;
  };

  public static getCaddyConfig = async (id: string): Promise<string> => {
    const response = await get<{ config: string }>(`/instances/${id}/config`);
    return response.config;
  };

  public static applyCaddyConfig = async (
    id: string,
    config: string,
  ): Promise<void> => {
    await post(`/instances/${id}/config`, { config });
  };

  public static getCaddyLogs = async (id: string): Promise<string> => {
    const response = await get<{ logs: string }>(`/instances/${id}/logs`);
    return response.logs;
  };
}
