import { api } from "@/api/client";

export const fixturesEnabled =
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIXTURES?.trim().toLowerCase() === "true";

export async function request(config, fixtureRequest) {
  if (fixturesEnabled && fixtureRequest) {
    return fixtureRequest();
  }

  const response = await api.request(config);
  return response.data;
}

export async function download(config, fixtureRequest) {
  if (fixturesEnabled && fixtureRequest) {
    return fixtureRequest();
  }

  const response = await api.request({ ...config, responseType: "blob" });
  return response.data;
}
