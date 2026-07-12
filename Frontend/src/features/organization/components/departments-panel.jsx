import { useMemo, useState } from "react";
import { Building2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { DepartmentDialog } from "@/features/organization/components/department-dialog";
import { OrganizationRowActions } from "@/features/organization/components/organization-row-actions";
import {
  useDepartments,
  useEmployees,
  useUpdateDepartment,
} from "@/hooks/queries/use-organization";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtNumber } from "@/lib/format";

export function DepartmentsPanel() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: status === "all" ? undefined : status,
    }),
    [debouncedSearch, status],
  );
  const departmentsQuery = useDepartments(params);
  const referenceDepartmentsQuery = useDepartments({});
  const employeesQuery = useEmployees({ page: 1, limit: 100 });
  const statusMutation = useUpdateDepartment();
  const departments = departmentsQuery.data?.data ?? [];
  const referenceDepartments = referenceDepartmentsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];
  const referenceError = referenceDepartmentsQuery.error ?? employeesQuery.error;
  const departmentById = new Map(
    referenceDepartments.map((department) => [department.id, department]),
  );

  function openCreate() {
    setEditingDepartment(null);
    setDialogOpen(true);
  }

  function openEdit(department) {
    setEditingDepartment(department);
    setDialogOpen(true);
  }

  async function toggleStatus() {
    const nextStatus = statusTarget.status === "active" ? "inactive" : "active";

    try {
      await statusMutation.mutateAsync({
        id: statusTarget.id,
        payload: { status: nextStatus },
      });
      toast.success(`${statusTarget.name} marked ${nextStatus}.`);
      setStatusTarget(null);
    } catch (error) {
      toast.error(error.message ?? "Department status could not be changed.");
    }
  }

  const columns = [
    {
      key: "name",
      header: "Department",
      render: (department) => (
        <div>
          <p className="font-medium text-foreground">{department.name}</p>
          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
            {department.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      key: "head",
      header: "Head",
      render: (department) => department.head?.full_name ?? "—",
    },
    {
      key: "parent",
      header: "Parent",
      render: (department) =>
        departmentById.get(department.parent_department_id)?.name ?? "—",
    },
    {
      key: "counts",
      header: "Coverage",
      render: (department) => (
        <div className="text-xs leading-5 text-muted-foreground">
          <p>{fmtNumber(department.employee_count)} employees</p>
          <p>{fmtNumber(department.asset_count)} assets</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (department) => <StatusBadge kind="entity" value={department.status} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      headerClassName: "w-12",
      cellClassName: "text-right",
      render: (department) => (
        <OrganizationRowActions
          active={department.status === "active"}
          ariaLabel={`Actions for ${department.name}`}
          onEdit={() => openEdit(department)}
          onToggleStatus={() => setStatusTarget(department)}
        />
      ),
    },
  ];

  return (
    <section className="space-y-5" aria-labelledby="departments-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="departments-heading" className="text-lg font-semibold text-foreground">
            Departments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintain hierarchy, accountable heads, and operational coverage.
          </p>
        </div>
        <Button type="button" onClick={openCreate} disabled={Boolean(referenceError)}>
          <Plus aria-hidden="true" />
          Add department
        </Button>
      </div>

      {referenceError ? (
        <QueryErrorState
          title="Department reference data is unavailable"
          error={referenceError}
          onRetry={() => {
            void referenceDepartmentsQuery.refetch();
            void employeesQuery.refetch();
          }}
          compact
        />
      ) : null}

      <div className="grid gap-3 rounded-xl border border-border/80 bg-card p-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="relative">
          <span className="sr-only">Search departments</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-9"
            placeholder="Search departments…"
          />
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full" aria-label="Department status filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={departments}
        caption="Organization departments"
        loading={departmentsQuery.isPending}
        error={departmentsQuery.error}
        onRetry={() => void departmentsQuery.refetch()}
        emptyTitle="No departments found"
        emptyDescription="Change the filters or create the first department."
        emptyAction={<Button onClick={openCreate} disabled={Boolean(referenceError)}>Add department</Button>}
        renderMobileCard={(department) => (
          <Card className="border border-border/80 ring-0">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <Building2 className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{department.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {department.description || "No description"}
                    </p>
                  </div>
                </div>
                <OrganizationRowActions
                  active={department.status === "active"}
                  ariaLabel={`Actions for ${department.name}`}
                  onEdit={() => openEdit(department)}
                  onToggleStatus={() => setStatusTarget(department)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge kind="entity" value={department.status} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" aria-hidden="true" />
                  {fmtNumber(department.employee_count)} employees
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Head</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {department.head?.full_name ?? "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Parent</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {departmentById.get(department.parent_department_id)?.name ?? "None"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      />

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDepartment}
        departments={referenceDepartments}
        employees={employees}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && !statusMutation.isPending && setStatusTarget(null)}
        title={`${statusTarget?.status === "active" ? "Deactivate" : "Activate"} department?`}
        description={
          statusTarget?.status === "active"
            ? `${statusTarget?.name} remains in historical records but cannot receive new assignments.`
            : `${statusTarget?.name} becomes available for new employee and asset assignments.`
        }
        confirmLabel={statusTarget?.status === "active" ? "Deactivate" : "Activate"}
        destructive={statusTarget?.status === "active"}
        pending={statusMutation.isPending}
        onConfirm={toggleStatus}
      />
    </section>
  );
}
