import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { applyOrganizationError } from "@/features/organization/organization-errors";
import {
  departmentPayload,
  departmentSchema,
} from "@/features/organization/organization-schemas";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/queries/use-organization";

const EMPTY_VALUES = {
  name: "",
  description: "",
  headId: "",
  parentDepartmentId: "",
};

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  departments = [],
  employees = [],
}) {
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const editing = Boolean(department);
  const pending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      department
        ? {
            name: department.name ?? "",
            description: department.description ?? "",
            headId: department.head?.id ?? "",
            parentDepartmentId: department.parent_department_id ?? "",
          }
        : EMPTY_VALUES,
    );
  }, [department, open, reset]);

  const employeeOptions = employees
    .filter(
      (employee) =>
        employee.status === "active" || employee.id === department?.head?.id,
    )
    .map((employee) => ({
      value: employee.id,
      label: employee.full_name,
      keywords: `${employee.email} ${employee.department_name ?? ""}`,
    }));
  const parentOptions = departments
    .filter(
      (item) =>
        item.id !== department?.id &&
        (item.status === "active" || item.id === department?.parent_department_id),
    )
    .map((item) => ({ value: item.id, label: item.name }));

  async function submit(values) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: department.id,
          payload: departmentPayload(values),
        });
        toast.success(`${values.name} updated.`);
      } else {
        await createMutation.mutateAsync(departmentPayload(values));
        toast.success(`${values.name} created.`);
      }

      onOpenChange(false);
    } catch (error) {
      applyOrganizationError(error, setError, {
        fields: ["name", "description", "headId", "parentDepartmentId"],
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit department" : "Create department"}</DialogTitle>
          <DialogDescription>
            Define ownership and hierarchy without changing employee roles.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          <FormField id="department-name" label="Name" required error={errors.name}>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                className="h-11"
                disabled={pending}
                {...register("name")}
              />
            )}
          </FormField>

          <FormField
            id="department-description"
            label="Description"
            error={errors.description}
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                className="min-h-24"
                disabled={pending}
                {...register("description")}
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="department-head"
              label="Department head"
              hint="Role promotion remains available only in the Employee Directory."
              error={errors.headId}
            >
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="headId"
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
                        { value: "__none__", label: "No department head" },
                        ...employeeOptions,
                      ]}
                      placeholder="Select an employee"
                      searchPlaceholder="Search employees…"
                      disabled={pending}
                      ariaLabel="Department head"
                    />
                  )}
                />
              )}
            </FormField>

            <FormField
              id="parent-department"
              label="Parent department"
              error={errors.parentDepartmentId}
            >
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="parentDepartmentId"
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
                        { value: "__none__", label: "No parent department" },
                        ...parentOptions,
                      ]}
                      placeholder="Select a parent"
                      searchPlaceholder="Search departments…"
                      disabled={pending}
                      ariaLabel="Parent department"
                    />
                  )}
                />
              )}
            </FormField>
          </div>

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
              ) : editing ? (
                "Save changes"
              ) : (
                "Create department"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
