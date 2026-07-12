import { request } from "@/api/transport";
import { getDashboardKpisFixture, getDashboardReturnsFixture } from "@/api/__fixtures__/dashboard";

export const getDashboardKpis = (signal) => request({ method: "get", url: "/dashboard/kpis", signal }, getDashboardKpisFixture);
export const getDashboardReturns = (type, signal) => request({ method: "get", url: "/dashboard/returns", params: { type }, signal }, () => getDashboardReturnsFixture(type));
