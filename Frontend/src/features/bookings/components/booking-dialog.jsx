import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { useCreateBooking, useRescheduleBooking } from "@/hooks/queries/use-bookings";
import { applyValidationErrors } from "@/lib/forms";
import { fmtDateTime } from "@/lib/format";
import { bookingSchema } from "@/features/bookings/schemas";
import { overlaps, toIso, toLocalInputParts } from "@/features/bookings/calendar-utils";

function formDefaults({ booking, slot, resourceId }) {
  if (booking) {
    const start = toLocalInputParts(booking.start_time);
    const end = toLocalInputParts(booking.end_time);
    return {
      assetId: booking.asset.id,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      purpose: booking.purpose ?? "",
    };
  }

  return {
    assetId: resourceId ?? "",
    date: slot?.date ?? "",
    startTime: slot?.startTime ?? "09:00",
    endTime: slot?.endTime ?? "10:00",
    purpose: "",
  };
}

export function BookingDialog({
  open,
  onOpenChange,
  resources = [],
  resourceId,
  bookings = [],
  slot = null,
  booking = null,
}) {
  const createMutation = useCreateBooking();
  const rescheduleMutation = useRescheduleBooking();
  const mutation = booking ? rescheduleMutation : createMutation;
  const resetCreateMutation = createMutation.reset;
  const resetRescheduleMutation = rescheduleMutation.reset;
  const [serverConflict, setServerConflict] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: formDefaults({ booking, slot, resourceId }),
  });

  useEffect(() => {
    if (open) {
      reset(formDefaults({ booking, slot, resourceId }));
      clearErrors();
      resetCreateMutation();
      resetRescheduleMutation();
      setServerConflict(null);
    }
  }, [booking, clearErrors, open, reset, resetCreateMutation, resetRescheduleMutation, resourceId, slot]);

  const values = watch();
  const localConflict = useMemo(() => {
    if (!values.assetId || !values.date || !values.startTime || !values.endTime || values.endTime <= values.startTime) {
      return null;
    }
    const start = toIso(values.date, values.startTime);
    const end = toIso(values.date, values.endTime);
    return bookings.find(
      (row) =>
        row.id !== booking?.id &&
        row.asset.id === values.assetId &&
        row.display_status !== "cancelled" &&
        overlaps(start, end, row.start_time, row.end_time),
    );
  }, [booking?.id, bookings, values.assetId, values.date, values.endTime, values.startTime]);

  useEffect(() => {
    if (!open) return;
    setServerConflict(null);
    clearErrors("root.server");
    if (booking) resetRescheduleMutation();
    else resetCreateMutation();
  }, [
    booking,
    clearErrors,
    open,
    resetCreateMutation,
    resetRescheduleMutation,
    values.assetId,
    values.date,
    values.endTime,
    values.startTime,
  ]);

  useEffect(() => {
    setServerConflict(null);
    clearErrors("root.server");
  }, [clearErrors, values.assetId, values.date, values.endTime, values.startTime]);

  async function submit(formValues) {
    clearErrors("root.server");
    setServerConflict(null);

    if (localConflict) {
      setError("root.server", {
        type: "conflict",
        message: "Choose a free time. The selected period overlaps an existing booking.",
      });
      return;
    }

    const payload = {
      asset_id: formValues.assetId,
      start_time: toIso(formValues.date, formValues.startTime),
      end_time: toIso(formValues.date, formValues.endTime),
      purpose: formValues.purpose?.trim() || null,
    };

    try {
      if (booking) {
        await rescheduleMutation.mutateAsync({
          id: booking.id,
          payload: { start_time: payload.start_time, end_time: payload.end_time },
        });
        toast.success("Booking rescheduled.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Resource booked.");
      }
      onOpenChange(false);
    } catch (error) {
      if (error?.code === "BOOKING_OVERLAP") {
        setServerConflict(error.details?.conflicting_booking ?? null);
        setError("root.server", {
          type: error.code,
          message: "That slot was just taken. Choose another time and try again.",
        });
        return;
      }
      if (!applyValidationErrors(error, setError, ["assetId", "date", "startTime", "endTime", "purpose"])) {
        setError("root.server", {
          type: error?.code ?? "server",
          message: error?.message ?? "The booking could not be saved.",
          requestId: error?.requestId,
        });
      }
    }
  }

  const conflict = serverConflict ?? localConflict;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{booking ? "Reschedule booking" : "Book a resource"}</DialogTitle>
          <DialogDescription>
            Bookings use half-open time ranges, so one booking may start exactly when another ends.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <FormField id="booking-resource" label="Resource" error={errors.assetId} required>
            {(fieldProps) => (
              <Controller
                control={control}
                name="assetId"
                render={({ field }) => (
                  <SearchSelect
                    {...fieldProps}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    options={resources.map((resource) => ({
                      value: resource.id,
                      label: `${resource.asset_tag} · ${resource.name}`,
                      keywords: resource.category?.name,
                    }))}
                    placeholder="Choose resource"
                    searchPlaceholder="Search resources…"
                    disabled
                  />
                )}
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="booking-date" label="Date" error={errors.date} required>
              {(fieldProps) => <Input {...fieldProps} type="date" min={toLocalInputParts(new Date().toISOString()).date} className="h-11" disabled={mutation.isPending} {...register("date")} />}
            </FormField>
            <FormField id="booking-start" label="Starts" error={errors.startTime} required>
              {(fieldProps) => <Input {...fieldProps} type="time" step="900" className="h-11" disabled={mutation.isPending} {...register("startTime")} />}
            </FormField>
            <FormField id="booking-end" label="Ends" error={errors.endTime} required>
              {(fieldProps) => <Input {...fieldProps} type="time" step="900" className="h-11" disabled={mutation.isPending} {...register("endTime")} />}
            </FormField>
          </div>

          {!booking ? (
            <FormField id="booking-purpose" label="Purpose" error={errors.purpose}>
              {(fieldProps) => <Textarea {...fieldProps} rows={3} maxLength={300} disabled={mutation.isPending} {...register("purpose")} />}
            </FormField>
          ) : null}

          {conflict ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4" role="status">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Time conflict</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Busy {fmtDateTime(conflict.start_time)}–{fmtDateTime(conflict.end_time)}
                    {conflict.booked_by?.full_name ? ` · ${conflict.booked_by.full_name}` : ""}.
                    {conflict.end_time ? ` Pick a slot starting at ${fmtDateTime(conflict.end_time)} or later.` : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <FormErrorAlert error={errors.root?.server ?? mutation.error} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {mutation.isPending ? "Saving…" : booking ? "Save new time" : "Confirm booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
