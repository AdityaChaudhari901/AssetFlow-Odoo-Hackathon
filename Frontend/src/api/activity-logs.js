import { request } from "@/api/transport";
import { listActivityFixtures } from "@/api/__fixtures__/activity-logs";

export const listActivityLogs = (params, signal) => request({ method: "get", url: "/activity-logs", params, signal }, () => listActivityFixtures(params));
