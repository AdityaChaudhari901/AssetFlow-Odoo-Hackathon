import { useEffect, useState } from "react";
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
import { SearchSelect } from "@/components/shared/search-select";
import { applyValidationErrors, setApiFieldError } from "@/lib/forms";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAllocationDepartments, useAllocationEmployees } from "@/hooks/queries/use-allocations";
import { useCreateTransfer } from "@/hooks/queries/use-transfers";
import { transferSchema } from "@/features/allocations/schemas";

export function TransferDialog({ open, onOpenChange, asset, initialTarget }) {
  const [targetSearch, setTargetSearch] = useState("");
  const debouncedTargetSearch = useDebouncedValue(targetSearch);
  const mutation = useCreateTransfer();
  const employees = useAllocationEmployees({ search: debouncedTargetSearch || undefined, limit: 50 }, { enabled: open });
  const departments = useAllocationDepartments({ status: "active", search: debouncedTargetSearch || undefined }, { enabled: open });
  const { control, register, handleSubmit, reset, setError, watch, formState: { errors } } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: { targetType: "employee", targetId: "", reason: "" },
  });
  const targetType = watch("targetType");

  useEffect(() => {
    if (open) {
      reset({
        targetType: initialTarget?.targetType ?? asset?.targetType ?? "employee",
        targetId: initialTarget?.targetId ?? asset?.targetId ?? "",
        reason: "",
      });
      setTargetSearch("");
      mutation.reset();
    }
  }, [asset?.id, initialTarget?.targetId, initialTarget?.targetType, open, reset]);

  const options = (
    targetType === "employee" ? employees.data?.data ?? [] : departments.data?.data ?? []
  ).map((item) => ({
    value: item.id,
    label: targetType === "employee" ? item.full_name : item.name,
  }));
  const pickerError = employees.error ?? departments.error;

  async function submit(values) {
    try {
      await mutation.mutateAsync({
        asset_id: asset.id,
        ...(values.targetType === "employee"
          ? { to_employee_id: values.targetId }
          : { to_department_id: values.targetId }),
        reason: values.reason || undefined,
      });
      toast.success("Transfer request submitted.");
      onOpenChange(false);
    } catch (error) {
      if (error.code === "DUPLICATE_RESOURCE") {
        setApiFieldError(setError, "targetId", error);
      } else if (!applyValidationErrors(error, setError, ["targetId", "reason"], {
        to_employee_id: "targetId",
        to_department_id: "targetId",
      })) {
        setError("root.server", { ...error, message: error.message });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request transfer</DialogTitle>
          <DialogDescription>
            {asset ? `${asset.asset_tag ?? "Asset"} · ${asset.name ?? "Selected asset"}` : "Choose a target."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="targetType"
              render={({ field }) => (
                <FormField id="transfer-target-type" label="Transfer to" required>
                  {(props) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setTargetSearch("");
                        reset({ ...watch(), targetType: value, targetId: "" });
                      }}
                    >
                      <SelectTrigger {...props} ref={field.ref} onBlur={field.onBlur}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="targetId"
              render={({ field }) => (
                <FormField id="transfer-target" label="New holder" required error={errors.targetId}>
                  {(props) => (
                    <SearchSelect
                      {...props}
                      ref={field.ref}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      options={options}
                      placeholder={`Choose ${targetType}`}
                      searchValue={targetSearch}
                      onSearchChange={setTargetSearch}
                      loading={employees.isLoading || departments.isLoading}
                      disabled={mutation.isPending}
                    />
                  )}
                </FormField>
              )}
            />
          </div>
          <FormField id="transfer-reason" label="Reason" error={errors.reason}>
            {(props) => <Textarea {...props} rows={4} {...register("reason")} />}
          </FormField>
          <FormErrorAlert error={errors.root?.server ?? mutation.error ?? pickerError} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!asset || mutation.isPending || Boolean(pickerError)}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {mutation.isPending ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
