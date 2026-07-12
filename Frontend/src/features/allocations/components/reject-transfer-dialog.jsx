import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { useRejectTransfer } from "@/hooks/queries/use-transfers";
import { applyValidationErrors } from "@/lib/forms";
import { rejectTransferSchema } from "@/features/allocations/schemas";

export function RejectTransferDialog({ open, onOpenChange, transfer, onStale }) {
  const mutation = useRejectTransfer();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(rejectTransferSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: "" });
      mutation.reset();
    }
  }, [open, reset, transfer?.id]);

  async function submit(values) {
    try {
      await mutation.mutateAsync({ id: transfer.id, payload: { reason: values.reason?.trim() || null } });
      toast.success("Transfer request rejected.");
      onOpenChange(false);
    } catch (error) {
      if (error?.code === "ALREADY_PROCESSED") await onStale?.();
      if (!applyValidationErrors(error, setError, ["reason"])) {
        setError("root.server", { ...error, message: error?.message ?? "The transfer could not be rejected." });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject transfer request?</DialogTitle>
          <DialogDescription>{transfer ? `${transfer.asset.asset_tag} will remain with ${transfer.from_holder.name}.` : "The current allocation will remain unchanged."}</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <FormField id="transfer-rejection-reason" label="Reason" error={errors.reason} hint="Optional, but useful for the requester.">
            {(props) => <Textarea {...props} rows={4} maxLength={500} disabled={mutation.isPending} {...register("reason")} />}
          </FormField>
          <FormErrorAlert error={errors.root?.server ?? mutation.error} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Keep pending</Button>
            <Button type="submit" variant="destructive" disabled={!transfer || mutation.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{mutation.isPending ? "Rejecting…" : "Reject request"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
