import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useAssets } from "@/hooks/queries/use-assets";
import { useCategories, useDepartments } from "@/hooks/queries/use-organization";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { APP_ROLES, ASSET_STATUS } from "@/lib/constants";
import { AssetFormDialog } from "@/features/assets/components/asset-form-dialog";
import { AssetMobileCard } from "@/features/assets/components/asset-mobile-card";
import { AssetThumbnail } from "@/features/assets/components/asset-thumbnail";
import { AssetToolbar } from "@/features/assets/components/asset-toolbar";

export function AssetListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const [registerOpen, setRegisterOpen] = useState(false);
  const searchFromUrl = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(searchFromUrl);
  const syncingSearchFromUrl = useRef(false);
  const debouncedSearch = useDebouncedValue(search);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const filters = useMemo(
    () => {
      const requestedStatus = searchParams.get("status");
      const requestedBookable = searchParams.get("is_bookable");

      return {
        search: searchParams.get("search") || undefined,
        category_id: searchParams.get("category_id") || undefined,
        status:
          requestedStatus && Object.hasOwn(ASSET_STATUS, requestedStatus)
            ? requestedStatus
            : undefined,
        department_id: searchParams.get("department_id") || undefined,
        is_bookable: ["true", "false"].includes(requestedBookable)
          ? requestedBookable
          : undefined,
        page,
        limit: 20,
      };
    },
    [page, searchParams],
  );

  useEffect(() => {
    if (search !== searchFromUrl) {
      syncingSearchFromUrl.current = true;
      setSearch(searchFromUrl);
    }
  }, [searchFromUrl]);

  useEffect(() => {
    if (syncingSearchFromUrl.current) {
      if (debouncedSearch === searchFromUrl) {
        syncingSearchFromUrl.current = false;
      }
      return;
    }

    if (debouncedSearch === searchFromUrl) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set("search", debouncedSearch);
    else next.delete("search");
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, searchFromUrl, searchParams, setSearchParams]);

  const assetsQuery = useAssets(filters);
  const categoriesQuery = useCategories({});
  const departmentsQuery = useDepartments({});
  const rows = assetsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const canManage = hasRole(APP_ROLES.ADMIN, APP_ROLES.ASSET_MANAGER);
  const referenceError = categoriesQuery.error ?? departmentsQuery.error;
  const referencesReady =
    !categoriesQuery.isLoading &&
    !departmentsQuery.isLoading &&
    !referenceError;
  const canRegister = canManage && referencesReady;

  useEffect(() => {
    const shouldRegister =
      searchParams.get("register") === "true" ||
      searchParams.get("action") === "register";

    if (!canRegister || !shouldRegister) {
      return;
    }

    setRegisterOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("register");
    next.delete("action");
    setSearchParams(next, { replace: true });
  }, [canRegister, searchParams, setSearchParams]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") {
      next.set("page", "1");
    }
    setSearchParams(next);
  }

  const columns = [
    {
      key: "asset",
      header: "Asset",
      render: (asset) => (
        <div className="flex items-center gap-3">
          <AssetThumbnail asset={asset} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{asset.name}</p>
            <p className="text-xs font-medium tabular-nums text-primary">{asset.asset_tag}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (asset) => asset.category?.name ?? "—" },
    { key: "status", header: "Status", render: (asset) => <StatusBadge kind="asset" value={asset.status} /> },
    { key: "condition", header: "Condition", render: (asset) => <StatusBadge kind="condition" value={asset.condition} /> },
    { key: "location", header: "Location", render: (asset) => <span className="block max-w-48 truncate">{asset.location ?? "—"}</span> },
    { key: "holder", header: "Holder", render: (asset) => asset.current_holder?.name ?? "Available pool" },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Asset registry"
        title="Assets"
        description="Search every tagged asset, inspect lifecycle state, and open its complete custody passport."
        actions={
          assetsQuery.isFetching && !assetsQuery.isLoading ? (
            <span className="text-xs text-muted-foreground" role="status">Refreshing registry…</span>
          ) : null
        }
      />

      <AssetToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={updateFilter}
        categories={categories}
        departments={departments}
        canManage={canRegister}
        onRegister={() => setRegisterOpen(true)}
      />

      {referenceError ? (
        <QueryErrorState
          title="Asset reference data is unavailable"
          error={referenceError}
          onRetry={() => {
            void categoriesQuery.refetch();
            void departmentsQuery.refetch();
          }}
          compact
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        loading={assetsQuery.isLoading}
        error={assetsQuery.error}
        onRetry={() => void assetsQuery.refetch()}
        caption="Asset registry"
        emptyTitle="No assets match these filters"
        emptyDescription="Clear a filter or register the first asset in this workspace."
        emptyAction={
          canRegister ? (
            <Button type="button" onClick={() => setRegisterOpen(true)}>Register asset</Button>
          ) : null
        }
        renderMobileCard={(asset) => <AssetMobileCard asset={asset} onOpen={() => navigate(`/assets/${asset.id}`)} />}
        onRowClick={(asset) => navigate(`/assets/${asset.id}`)}
        page={assetsQuery.data?.meta?.page ?? page}
        limit={assetsQuery.data?.meta?.limit ?? 20}
        total={assetsQuery.data?.meta?.total ?? rows.length}
        onPageChange={(nextPage) => updateFilter("page", String(nextPage))}
      />

      <AssetFormDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        categories={categories}
        departments={departments}
      />
    </section>
  );
}
