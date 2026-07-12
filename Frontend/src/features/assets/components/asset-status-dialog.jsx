import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { useChangeAssetStatus } from "@/hooks/queries/use-assets";
import { ASSET_STATUS, MANUAL_TRANSITIONS } from "@/lib/constants";
import { applyValidationErrors } from "@/lib/forms";
import { assetStatusSchema } from "@/features/assets/asset-schemas";

export function AssetStatusDialog({ asset, open, onOpenChange }) {
  const mutation = useChangeAssetStatus();
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetStatusSchema),
    defaultValues: { status: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      setAllowedStatuses(MANUAL_TRANSITIONS[asset?.status] ?? []);
      reset({ status: "", notes: "" });
      clearErrors();
    }
  }, [asset?.status, clearErrors, open, reset]);

  async function submit(values) {
    try {
      await mutation.mutateAsync({
        id: asset.id,
        payload: { status: values.status, notes: values.notes || null },
      });
      toast.success(`${asset.asset_tag} is now ${ASSET_STATUS[values.status]?.label}.`);
      onOpenChange(false);
    } catch (error) {
      if (error?.code === "INVALID_STATUS_TRANSITION") {
        const nextAllowed = (error.details?.allowed ?? []).filter((status) => ASSET_STATUS[status]);
        setAllowedStatuses(nextAllowed);
        setError("root.server", {
          type: error.code,
          message: "The asset changed elsewhere. Choose from the refreshed lifecycle options.",
          requestId: error.requestId,
        });
        return;
      }

      if (applyValidationErrors(error, setError, ["status", "notes"])) {
        return;
      }

      setError("root.server", {
        type: error?.code ?? "server",
        message: error?.message ?? "The asset status could not be changed.",
        requestId: error?.requestId,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change asset lifecycle status</DialogTitle>
          <DialogDescription>
            Only server-approved manual transitions are offered. Allocation and maintenance states change through their own workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/25 p-3">
          <span className="text-sm font-medium">Current status</span>
          <StatusBadge kind="asset" value={asset?.status} />
        </div>

        {allowedStatuses.length ? (
          <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
            <FormField id="asset-next-status" label="New status" error={errors.status} required>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                      <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="h-11 w-full">
                        <SelectValue placeholder="Choose status" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{ASSET_STATUS[status]?.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField id="asset-status-notes" label="Notes" error={errors.notes} hint="Optional context is retained in the activity ledger.">
              {(fieldProps) => (
                <Textarea {...fieldProps} rows={4} disabled={mutation.isPending} {...register("notes")} />
              )}
            </FormField>

            <FormErrorAlert error={errors.root?.server} />

            <DialogFooter>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {mutation.isPending ? "Updating…" : "Update status"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
            No manual transition is available from this lifecycle state.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
