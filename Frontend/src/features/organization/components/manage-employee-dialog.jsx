import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { applyOrganizationError } from "@/features/organization/organization-errors";
import {
  employeePayload,
  employeeSchema,
} from "@/features/organization/organization-schemas";
import { useUpdateEmployee } from "@/hooks/queries/use-organization";
import { APP_ROLES, ROLES } from "@/lib/constants";

export function ManageEmployeeDialog({
  open,
  onOpenChange,
  employee,
  departments = [],
  currentUserId,
  currentUserEmail,
  onCurrentUserUpdated,
}) {
  const updateMutation = useUpdateEmployee();
  const pending = updateMutation.isPending;
  const isSelf = Boolean(
    employee &&
      (employee.id === currentUserId ||
        employee.email?.toLowerCase() === currentUserEmail?.toLowerCase()),
  );
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      role: APP_ROLES.EMPLOYEE,
      departmentId: "",
      active: true,
    },
  });

  useEffect(() => {
    if (!open || !employee) {
      return;
    }

    reset({
      fullName: employee.full_name ?? "",
      role: employee.role ?? APP_ROLES.EMPLOYEE,
      departmentId: employee.department_id ?? "",
      active: employee.status === "active",
    });
  }, [employee, open, reset]);

  const departmentOptions = departments
    .filter(
      (department) =>
        department.status === "active" || department.id === employee?.department_id,
    )
    .map((department) => ({ value: department.id, label: department.name }));

  async function submit(values) {
    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        payload: employeePayload(values, { protectSelf: isSelf }),
      });

      if (isSelf) {
        await onCurrentUserUpdated?.();
      }

      toast.success(`${values.fullName} updated.`);
      onOpenChange(false);
    } catch (error) {
      if (error?.code === "CANNOT_MODIFY_SELF") {
        toast.error("You can't change your own role.");
        return;
      }

      applyOrganizationError(error, setError, {
        fields: ["fullName", "role", "departmentId", "active"],
        duplicateField: null,
      });
    }
  }

  if (!employee) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage employee</DialogTitle>
          <DialogDescription>
            This directory is the only place where organization roles can change.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          <div className="rounded-lg border border-border/80 bg-muted/25 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{employee.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {employee.active_allocations} active allocation
              {employee.active_allocations === 1 ? "" : "s"}
            </p>
          </div>

          <FormField id="employee-name" label="Full name" required error={errors.fullName}>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                className="h-11"
                disabled={pending}
                {...register("fullName")}
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="employee-role" label="Role" required error={errors.role}>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={pending || isSelf}
                    >
                      <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField id="employee-department" label="Department" error={errors.departmentId}>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <SearchSelect
                      {...fieldProps}
                      ref={field.ref}
                      value={field.value || "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? "" : value)
                      }
                      onBlur={field.onBlur}
                      options={[
                        { value: "__none__", label: "No department" },
                        ...departmentOptions,
                      ]}
                      placeholder="Select a department"
                      searchPlaceholder="Search departments…"
                      disabled={pending}
                      ariaLabel="Employee department"
                    />
                  )}
                />
              )}
            </FormField>
          </div>

          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Active account</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Inactive employees cannot sign in or receive new assignments.
                  </p>
                </div>
                <Switch
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={pending || isSelf}
                  aria-label="Employee active status"
                />
              </div>
            )}
          />

          {isSelf ? (
            <div className="flex gap-3 rounded-lg border border-primary/20 bg-accent/70 px-4 py-3 text-xs leading-5 text-accent-foreground">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Your own role and account status are locked. Another admin must change them.
            </div>
          ) : null}

          <FormErrorAlert error={errors.root?.server} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
