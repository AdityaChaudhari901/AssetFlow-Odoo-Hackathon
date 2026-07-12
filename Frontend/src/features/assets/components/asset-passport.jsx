import { useState } from "react";
import { ArrowLeftRight, CalendarPlus, MapPin, Pencil, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { ASSET_STATUS } from "@/lib/constants";
import { AssetStatusDialog } from "@/features/assets/components/asset-status-dialog";
import { AssetThumbnail } from "@/features/assets/components/asset-thumbnail";

function PassportField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

export function AssetPassport({ asset, canManage, canEdit = canManage, onEdit }) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const holder = asset.current_allocation?.employee?.full_name ?? asset.current_allocation?.department?.name;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="border border-border/80 ring-0">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <AssetThumbnail asset={asset} size="md" decorative={false} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Asset passport</p>
                <p className="mt-1 text-xl font-semibold tracking-tight">{asset.asset_tag}</p>
                <p className="mt-1 text-sm text-muted-foreground">Permanent identity record</p>
              </div>
            </div>
            <StatusBadge kind="asset" value={asset.status} className="self-start" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 py-5">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <PassportField label="Category" value={asset.category?.name} />
            <PassportField label="Serial number" value={asset.serial_number} />
            <PassportField label="Condition" value={<StatusBadge kind="condition" value={asset.condition} />} />
            <PassportField label="Department" value={asset.department?.name} />
            <PassportField label="Acquired" value={fmtDate(asset.acquisition_date)} />
            <PassportField label="Acquisition cost" value={fmtCurrency(asset.acquisition_cost)} />
          </dl>

          <Separator />

          <div className="flex flex-wrap gap-2">
            {canManage && asset.status === "available" ? (
              <Button asChild>
                <Link to={`/allocations?action=allocate&asset_id=${asset.id}`}>
                  <ArrowLeftRight aria-hidden="true" />
                  Allocate
                </Link>
              </Button>
            ) : null}
            {canManage ? (
              <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(true)}>
                <ShieldCheck aria-hidden="true" />
                Change status
              </Button>
            ) : null}
            {!['retired', 'disposed'].includes(asset.status) ? (
              <Button asChild variant="outline">
                <Link to={`/maintenance?action=raise&asset_id=${asset.id}`}>
                  <Wrench aria-hidden="true" />
                  Raise maintenance
                </Link>
              </Button>
            ) : null}
            {asset.is_bookable && !["under_maintenance", "lost", "retired", "disposed"].includes(asset.status) ? (
              <Button asChild variant="outline">
                <Link to={`/bookings?action=book&asset_id=${asset.id}`}>
                  <CalendarPlus aria-hidden="true" />
                  Book resource
                </Link>
              </Button>
            ) : null}
            {canEdit ? (
              <Button type="button" variant="ghost" onClick={onEdit}>
                <Pencil aria-hidden="true" />
                Edit details
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border border-border/80 ring-0">
          <CardHeader className="border-b border-border/70">
            <p className="text-sm font-semibold">Current custody</p>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            {holder ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{holder}</p>
                    <p className="text-xs text-muted-foreground">
                      Since {fmtDate(asset.current_allocation.allocated_at)}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/25 p-3 text-xs leading-5 text-muted-foreground">
                  Expected return: {fmtDate(asset.current_allocation.expected_return_date)}
                  {asset.current_allocation.is_overdue ? (
                    <StatusBadge kind="allocation" value="overdue" className="mt-2" />
                  ) : null}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/allocations?action=transfer&asset_id=${asset.id}`}>
                    Request transfer
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {asset.status === "available"
                  ? "No active holder. This asset is in the available pool."
                  : `No active holder. The asset is currently ${ASSET_STATUS[asset.status]?.label?.toLowerCase() ?? asset.status}.`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/80 ring-0">
          <CardContent className="flex items-start gap-3 py-4">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Last recorded location</p>
              <p className="mt-1 text-sm font-medium">{asset.location || "Not recorded"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssetStatusDialog asset={asset} open={statusDialogOpen} onOpenChange={setStatusDialogOpen} />
    </div>
  );
}
