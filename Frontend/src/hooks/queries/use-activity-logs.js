import { useQuery } from "@tanstack/react-query";

import { listActivityLogs } from "@/api/activity-logs";
import { queryKeys } from "@/hooks/queries/query-keys";

export const useActivityLogs = (params = {}, enabled = true) => useQuery({ queryKey: queryKeys.activity(params), queryFn: ({ signal }) => listActivityLogs(params, signal), enabled });
