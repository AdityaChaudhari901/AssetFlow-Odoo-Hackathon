import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeftRight, LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { applyValidationErrors } from "@/lib/forms";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useAllocationAssets,
  useAllocationDepartments,
  useAllocationEmployees,
  useCreateAllocation,
} from "@/hooks/queries/use-allocations";
import { allocationSchema } from "@/features/allocations/schemas";

const DEFAULT_VALUES = {
  assetId: "",
  targetType: "employee",
  targetId: "",
  expectedReturnDate: "",
  notes: "",
};

export function AllocateDialog({ open, onOpenChange, asset, onRequestTransfer }) {
  const [conflict, setConflict] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const debouncedAssetSearch = useDebouncedValue(assetSearch);
  const debouncedTargetSearch = useDebouncedValue(targetSearch);
  const mutation = useCreateAllocation();
  const assetsQuery = useAllocationAssets(
    { status: "available", search: debouncedAssetSearch || undefined, limit: 50 },
    { enabled: open && !asset },
  );
  const employeesQuery = useAllocationEmployees(
    { search: debouncedTargetSearch || undefined, limit: 50 },
    { enabled: open },
  );
  const departmentsQuery = useAllocationDepartments(
    { status: "active", search: debouncedTargetSearch || undefined },
    { enabled: open },
  );
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(allocationSchema), defaultValues: DEFAULT_VALUES });
  const targetType = watch("targetType");

  useEffect(() => {
    if (open) {
      reset({ ...DEFAULT_VALUES, assetId: asset?.id ?? "" });
      setConflict(null);
      setAssetSearch("");
      setTargetSearch("");
      mutation.reset();
    }
  }, [asset?.id, open, reset]);

  const assetOptions = (assetsQuery.data?.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.asset_tag} · ${item.name}`,
  }));
  if (asset && !assetOptions.some((option) => option.value === asset.id)) {
    assetOptions.unshift({ value: asset.id, label: `${asset.asset_tag} · ${asset.name}` });
  }
  const targetOptions = (
    targetType === "employee"
      ? employeesQuery.data?.data ?? []
      : departmentsQuery.data?.data ?? []
  ).map((item) => ({
    value: item.id,
    label:
      targetType === "employee"
        ? `${item.full_name}${item.department_name ? ` · ${item.department_name}` : ""}`
        : item.name,
  }));
  const pickerError =
    assetsQuery.error ?? employeesQuery.error ?? departmentsQuery.error;

  async function submit(values) {
    setConflict(null);
    try {
      const response = await mutation.mutateAsync({
        asset_id: values.assetId,
        ...(values.targetType === "employee"
          ? { employee_id: values.targetId }
          : { department_id: values.targetId }),
        expected_return_date: values.expectedReturnDate || undefined,
        notes: values.notes || undefined,
      });
      toast.success(`${response.data.asset.asset_tag} allocated successfully.`);
      onOpenChange(false);
    } catch (error) {
      if (error?.code === "ASSET_ALREADY_ALLOCATED") {
        setConflict({ error, values });
        return;
      }
      if (
        !applyValidationErrors(error, setError, [
          "assetId",
          "targetId",
          "expectedReturnDate",
          "notes",
        ], {
          employee_id: "targetId",
          department_id: "targetId",
        })
      ) {
        setError("root.server", { ...error, message: error.message });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Allocate asset</DialogTitle>
          <DialogDescription>
            Record one accountable employee or department as the current holder.
          </DialogDescription>
        </DialogHeader>

        {conflict ? (
          <div className="space-y-5">
            <Alert variant="destructive">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Asset is already allocated</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Currently held by <strong>{conflict.error.details?.current_holder?.name}</strong>
                  {conflict.error.details?.allocated_at
                    ? ` since ${fmtDateTime(conflict.error.details.allocated_at)}`
                    : ""}.
                </p>
                <p>
                  Expected return: {fmtDate(conflict.error.details?.expected_return_date, "Not set")}.
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const selectedAsset = assetOptions.find(
                    (option) => option.value === conflict.values.assetId,
                  );
                  onRequestTransfer({
                    id: conflict.values.assetId,
                    asset_tag: selectedAsset?.label.split(" · ")[0],
                    name: selectedAsset?.label.split(" · ").slice(1).join(" · "),
                    targetType: conflict.values.targetType,
                    targetId: conflict.values.targetId,
                  });
                  onOpenChange(false);
                }}
              >
                <ArrowLeftRight aria-hidden="true" />
                Request transfer instead
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
            <Controller
              control={control}
              name="assetId"
              render={({ field }) => (
                <FormField id="allocation-asset" label="Asset" required error={errors.assetId}>
                  {(props) => (
                    <SearchSelect
                      {...props}
                      ref={field.ref}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      options={assetOptions}
                      placeholder="Choose an available asset"
                      searchValue={assetSearch}
                      onSearchChange={setAssetSearch}
                      loading={assetsQuery.isLoading}
                      disabled={Boolean(asset) || mutation.isPending}
                    />
                  )}
                </FormField>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="targetType"
                render={({ field }) => (
                  <FormField id="allocation-target-type" label="Holder type" required>
                    {(props) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTargetSearch("");
                          reset({ ...watch(), targetType: value, targetId: "" });
                        }}
                        disabled={mutation.isPending}
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
                  <FormField id="allocation-target" label="Holder" required error={errors.targetId}>
                    {(props) => (
                      <SearchSelect
                        {...props}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        options={targetOptions}
                        placeholder={`Choose ${targetType}`}
                        searchValue={targetSearch}
                        onSearchChange={setTargetSearch}
                        loading={employeesQuery.isLoading || departmentsQuery.isLoading}
                        disabled={mutation.isPending}
                      />
                    )}
                  </FormField>
                )}
              />
            </div>

            <FormField
              id="allocation-return-date"
              label="Expected return date"
              error={errors.expectedReturnDate}
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  disabled={mutation.isPending}
                  {...register("expectedReturnDate")}
                />
              )}
            </FormField>
            <FormField id="allocation-notes" label="Notes" error={errors.notes}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  disabled={mutation.isPending}
                  {...register("notes")}
                />
              )}
            </FormField>
            <FormErrorAlert error={errors.root?.server ?? mutation.error ?? pickerError} />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || Boolean(pickerError)}>
                {mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {mutation.isPending ? "Allocating…" : "Allocate asset"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
