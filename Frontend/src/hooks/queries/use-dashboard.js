import { useQuery } from "@tanstack/react-query";

import { getDashboardKpis, getDashboardReturns } from "@/api/dashboard";
import { queryKeys } from "@/hooks/queries/query-keys";

export const useDashboardKpis = () => useQuery({ queryKey: queryKeys.kpis(), queryFn: ({ signal }) => getDashboardKpis(signal) });
export const useDashboardReturns = (type) => useQuery({ queryKey: queryKeys.dashboardReturns(type), queryFn: ({ signal }) => getDashboardReturns(type, signal) });
