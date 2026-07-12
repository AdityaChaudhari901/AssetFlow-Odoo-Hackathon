import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useAllocations, useRequestAllocationReturn } from "@/hooks/queries/use-allocations";
import { useAsset } from "@/hooks/queries/use-assets";
import { useApproveTransfer, useTransfers } from "@/hooks/queries/use-transfers";
import { AllocateDialog } from "@/features/allocations/components/allocate-dialog";
import { AllocationList } from "@/features/allocations/components/allocation-list";
import { ReturnDialog } from "@/features/allocations/components/return-dialog";
import { RejectTransferDialog } from "@/features/allocations/components/reject-transfer-dialog";
import { TransferDialog } from "@/features/allocations/components/transfer-dialog";
import { TransferList } from "@/features/allocations/components/transfer-list";
import { APP_ROLES } from "@/lib/constants";

const TABS = [
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
  { value: "transfers", label: "Transfer requests" },
];

export function AllocationListPage() {
  const { isManager, user } = useAuth();
  const isEmployee = user?.role === APP_ROLES.EMPLOYEE;
  const canReviewTransfers = [APP_ROLES.ADMIN, APP_ROLES.ASSET_MANAGER, APP_ROLES.DEPARTMENT_HEAD].includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") ?? searchParams.get("status");
  const tab = TABS.some((item) => item.value === requestedTab)
    ? requestedTab
    : "active";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const mine = searchParams.has("mine") ? searchParams.get("mine") === "true" : isEmployee;
  const requestedAssetId = searchParams.get("asset_id");
  const requestedAssetQuery = useAsset(requestedAssetId);
  const allocationQuery = useAllocations({
    status: tab === "transfers" ? "active" : tab,
    mine: mine || undefined,
    page,
    limit: 20,
  });
  const transferQuery = useTransfers({
    status: "pending",
    mine: mine || undefined,
    page,
    limit: 20,
  });
  const requestReturn = useRequestAllocationReturn();
  const approveTransfer = useApproveTransfer();
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateAsset, setAllocateAsset] = useState(null);
  const [returnAllocation, setReturnAllocation] = useState(null);
  const [transferAsset, setTransferAsset] = useState(null);
  const [decision, setDecision] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    const action = searchParams.get("action");
    const asset = requestedAssetQuery.data?.data;
    if (!asset || !["allocate", "transfer"].includes(action)) return;
    if (action === "allocate") {
      setAllocateAsset(asset);
      setAllocateOpen(true);
    }
    if (action === "transfer") setTransferAsset(asset);
    const params = new URLSearchParams(searchParams);
    params.delete("action");
    setSearchParams(params, { replace: true });
  }, [requestedAssetQuery.data?.data, searchParams, setSearchParams]);

  function updateParams(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value == null) params.delete(key);
      else params.set(key, String(value));
    });
    setSearchParams(params, { replace: true });
  }

  async function confirmDecision() {
    try {
      const response = await approveTransfer.mutateAsync(decision.row.id);
      toast.success(`Reallocated to ${response.data.new_allocation.holder.name}.`);
      setDecision(null);
    } catch (error) {
      toast.error(error.code === "ALREADY_PROCESSED" ? "Someone beat you to it. The list was refreshed." : error.message);
      await transferQuery.refetch();
      setDecision(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Custody control"
        title="Allocations & Transfers"
        description="Track accountable custody, overdue returns, and approval-based transfers."
        actions={isManager ? <Button onClick={() => { setAllocateAsset(null); setAllocateOpen(true); }}><PackagePlus aria-hidden="true" /> Allocate asset</Button> : null}
      />
      <Tabs
        value={tab}
        onValueChange={(value) => updateParams({ tab: value, status: null, page: 1 })}
      >
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          {TABS.map((item) => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {tab === "transfers" ? (
        <TransferList
          query={transferQuery}
          page={page}
          onPageChange={(value) => updateParams({ page: value })}
          onApprove={(row) => setDecision({ type: "approve", row })}
          onReject={setRejectTarget}
          pending={approveTransfer.isPending}
          canReview={canReviewTransfers}
        />
      ) : (
        <AllocationList
          query={allocationQuery}
          page={page}
          onPageChange={(value) => updateParams({ page: value })}
          onRequestReturn={async (row) => {
            try {
              await requestReturn.mutateAsync(row.id);
              toast.success("Return request submitted.");
            } catch (error) {
              toast.error(error.message);
            }
          }}
          onCheckIn={setReturnAllocation}
          onTransfer={(row) => setTransferAsset(row.asset)}
          pending={requestReturn.isPending}
          canManage={isManager}
        />
      )}

      <AllocateDialog
        open={allocateOpen}
        onOpenChange={(open) => { setAllocateOpen(open); if (!open) setAllocateAsset(null); }}
        asset={allocateAsset}
        onRequestTransfer={(asset) => setTransferAsset(asset)}
      />
      <TransferDialog
        open={Boolean(transferAsset)}
        onOpenChange={(open) => !open && setTransferAsset(null)}
        asset={transferAsset}
      />
      <ReturnDialog
        open={Boolean(returnAllocation)}
        onOpenChange={(open) => !open && setReturnAllocation(null)}
        allocation={returnAllocation}
      />
      <RejectTransferDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        transfer={rejectTarget}
        onStale={transferQuery.refetch}
      />
      <ConfirmDialog
        open={Boolean(decision)}
        onOpenChange={(open) => !open && setDecision(null)}
        title="Approve transfer?"
        description={decision ? `${decision.row.asset.asset_tag} will move to ${decision.row.to_target.name}.` : ""}
        confirmLabel="Approve transfer"
        pending={approveTransfer.isPending}
        onConfirm={confirmDecision}
      />
    </section>
  );
}
