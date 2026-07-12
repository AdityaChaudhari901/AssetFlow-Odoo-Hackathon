import { useState } from "react";
import { ArrowLeft, PackageX } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { useAuth } from "@/hooks/use-auth";
import { useAsset, useAssetHistory } from "@/hooks/queries/use-assets";
import { useCategories, useDepartments } from "@/hooks/queries/use-organization";
import { APP_ROLES } from "@/lib/constants";
import { AssetFormDialog } from "@/features/assets/components/asset-form-dialog";
import { AssetHistoryTabs } from "@/features/assets/components/asset-history-tabs";
import { AssetPassport } from "@/features/assets/components/asset-passport";

export function AssetDetailPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const assetQuery = useAsset(id);
  const historyQuery = useAssetHistory(id);
  const categoriesQuery = useCategories({});
  const departmentsQuery = useDepartments({});
  const asset = assetQuery.data?.data;
  const canManage = hasRole(APP_ROLES.ADMIN, APP_ROLES.ASSET_MANAGER);
  const referenceError = categoriesQuery.error ?? departmentsQuery.error;
  const canEdit =
    canManage &&
    !categoriesQuery.isLoading &&
    !departmentsQuery.isLoading &&
    !referenceError;

  if (assetQuery.isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </section>
    );
  }

  if (assetQuery.error?.status === 404) {
    return (
      <EmptyState
        icon={PackageX}
        title="Asset passport not found"
        description="The asset may have been removed or the link is no longer valid."
        action={<Button asChild><Link to="/assets">Return to assets</Link></Button>}
      />
    );
  }

  if (assetQuery.error) {
    return <QueryErrorState error={assetQuery.error} onRetry={() => void assetQuery.refetch()} />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button asChild variant="ghost" className="-ml-2 h-10">
        <Link to="/assets"><ArrowLeft aria-hidden="true" />Back to assets</Link>
      </Button>

      <PageHeader
        eyebrow="Asset passport"
        title={asset.name}
        description={`${asset.asset_tag} · Identity, custody, condition, maintenance, and audit evidence in one record.`}
      />

      <AssetPassport
        asset={asset}
        canManage={canManage}
        canEdit={canEdit}
        onEdit={() => setEditOpen(true)}
      />

      {referenceError ? (
        <QueryErrorState
          title="Editing reference data is unavailable"
          error={referenceError}
          onRetry={() => {
            void categoriesQuery.refetch();
            void departmentsQuery.refetch();
          }}
          compact
        />
      ) : null}

      {historyQuery.error ? (
        <QueryErrorState error={historyQuery.error} onRetry={() => void historyQuery.refetch()} compact />
      ) : (
        <AssetHistoryTabs history={historyQuery.data?.data} loading={historyQuery.isLoading} />
      )}

      <AssetFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        asset={asset}
        categories={categoriesQuery.data?.data ?? []}
        departments={departmentsQuery.data?.data ?? []}
      />
    </section>
  );
}
