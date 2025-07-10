import { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

interface UseScriptDataOptions {
  dataSource: "local" | "firestore";
  enableAutoRefresh?: boolean;
  cacheTime?: number; // in milliseconds
}

export function useScriptData({
  dataSource,
  enableAutoRefresh = false,
  cacheTime = 1000 * 60 * 60 * 24, // 24 hours default
}: UseScriptDataOptions) {
  const { data: session } = useSession();
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Determine if we should enable the query
  const shouldEnableQuery =
    dataSource === "local" ||
    (dataSource === "firestore" && !!session?.user?.email);

  // Main data query with optimized caching
  const {
    data: scriptData,
    isLoading,
    error,
    refetch,
  } = api.scriptData.getAll.useQuery(
    { dataSource },
    {
      enabled: shouldEnableQuery,
      refetchOnWindowFocus: false,
      refetchOnMount: enableAutoRefresh,
      refetchOnReconnect: enableAutoRefresh,
      staleTime: cacheTime, // Data is considered fresh for cacheTime
    },
  );

  // Manual refresh function
  const refreshData = useCallback(async () => {
    if (!shouldEnableQuery) return;

    setIsManualRefreshing(true);
    try {
      await refetch();
      setLastRefresh(Date.now());
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch, shouldEnableQuery]);

  // Check if data is stale (older than cacheTime)
  const isDataStale = Date.now() - lastRefresh > cacheTime;

  return {
    data: scriptData,
    isLoading: isLoading || isManualRefreshing,
    error,
    refreshData,
    isDataStale,
    lastRefresh,
    isManualRefreshing,
  };
}
