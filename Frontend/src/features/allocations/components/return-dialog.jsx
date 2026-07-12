import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { applyValidationErrors } from "@/lib/forms";
import { titleCase } from "@/lib/format";
import { CONDITION } from "@/lib/constants";
import { useReturnAllocation } from "@/hooks/queries/use-allocations";
import { returnSchema } from "@/features/allocations/schemas";

export function ReturnDialog({ open, onOpenChange, allocation }) {
  const mutation = useReturnAllocation();
  const { control, register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(returnSchema),
    defaultValues: { condition: "good", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ condition: "good", notes: "" });
      mutation.reset();
    }
  }, [open, reset]);

  async function submit(values) {
    try {
      await mutation.mutateAsync({ id: allocation.id, payload: values });
      toast.success("Asset back in pool.");
      onOpenChange(false);
    } catch (error) {
      if (!applyValidationErrors(error, setError, ["condition", "notes"])) {
        setError("root.server", { ...error, message: error.message });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Check in asset</DialogTitle>
          <DialogDescription>
            Record the return condition for {allocation?.asset?.asset_tag} · {allocation?.asset?.name}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <Controller
            control={control}
            name="condition"
            render={({ field }) => (
              <FormField id="return-condition" label="Condition" required error={errors.condition}>
                {(props) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                    <SelectTrigger {...props} ref={field.ref} onBlur={field.onBlur}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION.map((condition) => (
                        <SelectItem key={condition} value={condition}>{titleCase(condition)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            )}
          />
          <FormField id="return-notes" label="Return notes" error={errors.notes}>
            {(props) => <Textarea {...props} rows={4} disabled={mutation.isPending} {...register("notes")} />}
          </FormField>
          <FormErrorAlert error={errors.root?.server ?? mutation.error} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!allocation || mutation.isPending}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {mutation.isPending ? "Checking in…" : "Confirm check in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
