import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { createAuditSchema } from "@/features/audits/audit-schemas";
import { useAuditOptions, useCreateAudit } from "@/hooks/queries/use-audits";
import { applyValidationErrors } from "@/lib/forms";

const INITIAL_VALUES = {
  name: "",
  departmentId: "",
  location: "",
  dates: { from: undefined, to: undefined },
  auditorIds: [],
};

export function CreateAuditDialog({ open, onOpenChange }) {
  const [auditorSearch, setAuditorSearch] = useState("");
  const optionsQuery = useAuditOptions(open);
  const createMutation = useCreateAudit();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createAuditSchema),
    defaultValues: INITIAL_VALUES,
  });
  const options = optionsQuery.data?.data ?? {
    departments: [],
    employees: [],
  };
  const normalizedAuditorSearch = auditorSearch.trim().toLowerCase();
  const visibleEmployees = options.employees.filter((employee) =>
    !normalizedAuditorSearch ||
    [employee.full_name, employee.email, employee.department_name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedAuditorSearch)),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(INITIAL_VALUES);
    setAuditorSearch("");
    clearErrors();
    createMutation.reset();
  }, [clearErrors, open, reset]);

  async function submit(values) {
    clearErrors("root.server");

    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        department_id: values.departmentId || null,
        location: values.location?.trim() || null,
        start_date: format(values.dates.from, "yyyy-MM-dd"),
        end_date: format(values.dates.to, "yyyy-MM-dd"),
        auditor_ids: values.auditorIds,
      });
      toast.success("Audit cycle created and assets snapshotted.");
      onOpenChange(false);
    } catch (error) {
      if (
        !applyValidationErrors(error, setError, [
          "name",
          "departmentId",
          "location",
          "dates",
          "auditorIds",
        ])
      ) {
        setError("root.server", {
          type: error?.code ?? "server",
          message: error?.message ?? "The audit cycle could not be created.",
          requestId: error?.requestId,
        });
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) =>
        !createMutation.isPending && onOpenChange(nextOpen)
      }
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create audit cycle</DialogTitle>
          <DialogDescription>
            All assets in scope are snapshotted for verification. Closing the
            cycle locks its evidence.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-audit-form"
          className="space-y-5"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          <FormField id="audit-name" label="Cycle name" error={errors.name} required>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                className="h-11"
                disabled={createMutation.isPending}
                {...register("name")}
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="audit-department"
              label="Department scope"
              error={errors.departmentId}
            >
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <SearchSelect
                      {...fieldProps}
                      ref={field.ref}
                      value={field.value || "__organization__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__organization__" ? "" : value)
                      }
                      onBlur={field.onBlur}
                      options={[
                        { value: "__organization__", label: "Organization-wide" },
                        ...options.departments.map((department) => ({
                          value: department.id,
                          label: department.name,
                        })),
                      ]}
                      placeholder="Organization-wide"
                      loading={optionsQuery.isLoading}
                      disabled={createMutation.isPending}
                    />
                  )}
                />
              )}
            </FormField>

            <FormField
              id="audit-location"
              label="Location contains"
              error={errors.location}
              hint="Optional text match within the selected department."
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  className="h-11"
                  placeholder="Optional"
                  disabled={createMutation.isPending}
                  {...register("location")}
                />
              )}
            </FormField>
          </div>

          <FormField
            id="audit-date-range"
            label="Date range"
            error={errors.dates}
            required
          >
            {(fieldProps) => (
              <Controller
                control={control}
                name="dates"
                render={({ field }) => (
                  <DateRangePicker
                    {...fieldProps}
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={createMutation.isPending}
                    className="w-full"
                    ariaLabel="Choose audit date range"
                  />
                )}
              />
            )}
          </FormField>

          <Controller
            control={control}
            name="auditorIds"
            render={({ field }) => (
              <fieldset
                className="space-y-3"
                aria-invalid={errors.auditorIds ? true : undefined}
                aria-describedby={
                  errors.auditorIds ? "audit-auditors-error" : undefined
                }
              >
                <legend className="text-sm font-medium">
                  Assigned auditors<span className="text-destructive" aria-hidden="true">*</span>
                </legend>
                <label className="relative block">
                  <span className="sr-only">Search auditors</span>
                  <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={auditorSearch}
                    onChange={(event) => setAuditorSearch(event.target.value)}
                    placeholder="Search name, email, or department"
                    className="h-11 pl-9"
                    disabled={createMutation.isPending || optionsQuery.isLoading}
                  />
                </label>
                <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border border-border/80 p-3 sm:grid-cols-2">
                  {visibleEmployees.map((employee) => {
                    const id = `auditor-${employee.id}`;
                    const checked = field.value.includes(employee.id);

                    return (
                      <div key={employee.id} className="flex min-h-10 items-center gap-3">
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={(nextChecked) =>
                            field.onChange(
                              nextChecked
                                ? [...field.value, employee.id]
                                : field.value.filter((value) => value !== employee.id),
                            )
                          }
                          disabled={createMutation.isPending}
                        />
                        <Label htmlFor={id} className="min-w-0">
                          <span className="truncate">{employee.full_name}</span>
                        </Label>
                      </div>
                    );
                  })}
                  {!optionsQuery.isLoading && !visibleEmployees.length ? (
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                      {options.employees.length
                        ? "No auditors match this search."
                        : "No active employees are available as auditors."}
                    </p>
                  ) : null}
                </div>
                {errors.auditorIds ? (
                  <p id="audit-auditors-error" className="text-xs text-destructive">
                    {errors.auditorIds.message}
                  </p>
                ) : null}
              </fieldset>
            )}
          />

          <FormErrorAlert
            error={errors.root?.server ?? optionsQuery.error}
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-audit-form"
            className="h-11"
            disabled={
              createMutation.isPending ||
              optionsQuery.isLoading ||
              Boolean(optionsQuery.error)
            }
          >
            {createMutation.isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              "Create audit cycle"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
