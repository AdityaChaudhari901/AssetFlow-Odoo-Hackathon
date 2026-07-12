import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { SearchSelect } from "@/components/shared/search-select";
import { BookingCalendar } from "@/features/bookings/components/booking-calendar";
import { BookingDialog } from "@/features/bookings/components/booking-dialog";
import { MyBookingsList } from "@/features/bookings/components/my-bookings-list";
import { dayKey, weekStart } from "@/features/bookings/calendar-utils";
import { useAsset } from "@/hooks/queries/use-assets";
import { useBookableResources, useBookings, useCancelBooking } from "@/hooks/queries/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

function nextBookingSlot() {
  const date = new Date();
  let hour = date.getHours() + (date.getMinutes() > 0 ? 1 : 0);
  if (hour < 7) hour = 7;
  if (hour >= 21) {
    date.setDate(date.getDate() + 1);
    hour = 9;
  }
  const startTime = `${String(hour).padStart(2, "0")}:00`;
  const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
  return { date: dayKey(date), startTime, endTime };
}

export function BookingPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resourceSearch, setResourceSearch] = useState("");
  const debouncedResourceSearch = useDebouncedValue(resourceSearch);
  const resourcesQuery = useBookableResources({
    search: debouncedResourceSearch || undefined,
    limit: 50,
  });
  const requestedResource = searchParams.get("asset_id") ?? searchParams.get("resource");
  const requestedResourceQuery = useAsset(requestedResource);
  const requestedAsset = requestedResourceQuery.data?.data;
  const requestedAssetIsBookable = Boolean(
    requestedAsset?.is_bookable &&
    !["under_maintenance", "lost", "retired", "disposed"].includes(
      requestedAsset.status,
    ),
  );
  const listedResources = resourcesQuery.data?.data ?? [];
  const resources =
    requestedAssetIsBookable &&
    !listedResources.some((resource) => resource.id === requestedAsset.id)
      ? [requestedAsset, ...listedResources]
      : listedResources;
  const matchedRequestedResource = resources.find(
    (resource) => resource.id === requestedResource,
  );
  const resourceId = requestedResource
    ? matchedRequestedResource?.id ?? ""
    : resources[0]?.id ?? "";
  const requestedResourceUnavailable = Boolean(
    requestedResource &&
    !resourcesQuery.isLoading &&
    !requestedResourceQuery.isLoading &&
    !resourcesQuery.error &&
    (!requestedResourceQuery.error || requestedResourceQuery.error.status === 404) &&
    !matchedRequestedResource,
  );
  const requestedResourceLookupError =
    requestedResourceQuery.error?.status === 404
      ? null
      : requestedResourceQuery.error;
  const requestedWeek = searchParams.get("week");
  const week = useMemo(() => {
    const parsed = requestedWeek ? new Date(`${requestedWeek}T12:00:00`) : new Date();
    return weekStart(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
  }, [requestedWeek]);
  const from = new Date(week); from.setHours(0, 0, 0, 0);
  const to = addDays(from, 7);
  const calendarQuery = useBookings({ asset_id: resourceId || undefined, from: from.toISOString(), to: to.toISOString(), status: "confirmed", limit: 100 }, { enabled: Boolean(resourceId) });
  const myBookingsQuery = useBookings({ mine: true, limit: 100 });
  const cancelMutation = useCancelBooking();
  const [dialogState, setDialogState] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    if (!resources.length || resourceId || !resources[0]) return;
    const params = new URLSearchParams(searchParams);
    params.set("resource", resources[0].id);
    setSearchParams(params, { replace: true });
  }, [resourceId, resources, searchParams, setSearchParams]);

  useEffect(() => {
    const createRequested = ["book", "create"].includes(searchParams.get("action")) || ["true", "1"].includes(searchParams.get("create"));
    if (!createRequested) return;
    if (requestedResourceUnavailable) {
      const params = new URLSearchParams(searchParams);
      params.delete("action");
      params.delete("create");
      setSearchParams(params, { replace: true });
      return;
    }
    if (!resourceId) return;
    setDialogState({ type: "create", slot: nextBookingSlot() });
    const params = new URLSearchParams(searchParams);
    params.delete("action");
    params.delete("create");
    setSearchParams(params, { replace: true });
  }, [requestedResourceUnavailable, resourceId, searchParams, setSearchParams]);

  function updateParams(changes) {
    const params = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    setSearchParams(params, { replace: true });
  }

  async function confirmCancel() {
    try {
      await cancelMutation.mutateAsync({ id: cancelTarget.id, payload: {} });
      toast.success("Booking cancelled.");
      setCancelTarget(null);
    } catch (error) {
      toast.error(error?.message ?? "The booking could not be cancelled.");
    }
  }

  const selectedResource = resources.find((resource) => resource.id === resourceId);
  const visibleBookings = calendarQuery.data?.data ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Shared resources"
        title="Resource booking"
        description="Reserve rooms, vehicles, and equipment with conflict-safe scheduling."
        actions={<Button disabled={!resourceId} onClick={() => setDialogState({ type: "create", slot: nextBookingSlot() })}><CalendarPlus aria-hidden="true" /> Book resource</Button>}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <p className="mb-2 text-sm font-medium">Resource</p>
            <SearchSelect
              value={resourceId}
              onValueChange={(value) => {
                setResourceSearch("");
                updateParams({ resource: value, asset_id: "" });
              }}
              options={resources.map((resource) => ({ value: resource.id, label: `${resource.asset_tag} · ${resource.name}`, keywords: resource.category?.name }))}
              placeholder={resourcesQuery.isLoading ? "Loading resources…" : "Choose resource"}
              searchValue={resourceSearch}
              onSearchChange={setResourceSearch}
              loading={resourcesQuery.isLoading}
              disabled={resourcesQuery.isLoading}
              ariaLabel="Choose bookable resource"
            />
            {resourcesQuery.error ? <p className="mt-2 text-xs text-destructive">{resourcesQuery.error.message}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Previous week" onClick={() => updateParams({ week: dayKey(addDays(week, -7)) })}><ChevronLeft aria-hidden="true" /></Button>
            <Button type="button" variant="outline" onClick={() => updateParams({ week: dayKey(weekStart(new Date())) })}>Today</Button>
            <Button type="button" variant="outline" size="icon" aria-label="Next week" onClick={() => updateParams({ week: dayKey(addDays(week, 7)) })}><ChevronRight aria-hidden="true" /></Button>
          </div>
        </CardContent>
      </Card>

      {requestedResourceUnavailable ? (
        <div className="rounded-xl border border-asset-maintenance-border bg-asset-maintenance-surface p-4 text-sm text-asset-maintenance" role="alert">
          The requested resource is not currently bookable. Choose another available resource to continue.
        </div>
      ) : null}
      {requestedResourceLookupError ? (
        <QueryErrorState
          title="The requested resource could not be verified"
          error={requestedResourceLookupError}
          onRetry={() => void requestedResourceQuery.refetch()}
          compact
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Week of {format(week, "d MMMM yyyy")}</h2><p className="text-sm text-muted-foreground">Select any hourly cell to start a booking.</p></div>
      </div>
      <BookingCalendar
        week={week}
        query={calendarQuery}
        resource={selectedResource}
        currentUserId={user?.id}
        onSelectSlot={(slot) => setDialogState({ type: "create", slot })}
        onSelectBooking={(booking) => {
          const isMine = booking.is_mine ?? booking.booked_by?.id === user?.id;
          if (isMine && booking.display_status === "upcoming") setDialogState({ type: "edit", booking });
        }}
      />

      <div className="space-y-3 pt-3"><div><h2 className="text-lg font-semibold">My bookings</h2><p className="text-sm text-muted-foreground">Reschedule or cancel your upcoming reservations.</p></div><MyBookingsList query={myBookingsQuery} onReschedule={(booking) => setDialogState({ type: "edit", booking })} onCancel={setCancelTarget} /></div>

      <BookingDialog
        open={Boolean(dialogState)}
        onOpenChange={(open) => !open && setDialogState(null)}
        resources={resources}
        resourceId={dialogState?.booking?.asset?.id ?? resourceId}
        bookings={visibleBookings}
        slot={dialogState?.slot}
        booking={dialogState?.booking}
      />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this booking?"
        description={cancelTarget ? `${cancelTarget.asset.name} will become available for the reserved time.` : ""}
        confirmLabel="Cancel booking"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={confirmCancel}
      />
    </section>
  );
}
