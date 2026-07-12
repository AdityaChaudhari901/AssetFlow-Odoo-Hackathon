import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Settings2, UsersRound } from "lucide-react";
import { useSearchParams } from "react-router";

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
import { DataTable } from "@/components/shared/data-table";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserChip } from "@/components/shared/user-chip";
import { ManageEmployeeDialog } from "@/features/organization/components/manage-employee-dialog";
import {
  useDepartments,
  useEmployees,
} from "@/hooks/queries/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ROLES } from "@/lib/constants";
import { fmtNumber } from "@/lib/format";

const PAGE_SIZE = 20;

function positivePage(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function EmployeesPanel() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(searchFromUrl);
  const syncingSearchFromUrl = useRef(false);
  const [managedEmployee, setManagedEmployee] = useState(null);
  const debouncedSearch = useDebouncedValue(search);
  const role = searchParams.get("role") ?? "all";
  const departmentId = searchParams.get("department_id") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const page = positivePage(searchParams.get("page"));

  useEffect(() => {
    if (search !== searchFromUrl) {
      syncingSearchFromUrl.current = true;
      setSearch(searchFromUrl);
    }
  }, [searchFromUrl]);

  useEffect(() => {
    const normalizedSearch = debouncedSearch.trim();

    if (syncingSearchFromUrl.current) {
      if (normalizedSearch === searchFromUrl) {
        syncingSearchFromUrl.current = false;
      }
      return;
    }

    if (normalizedSearch === searchFromUrl) {
      return;
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (normalizedSearch) {
          next.set("search", normalizedSearch);
        } else {
          next.delete("search");
        }

        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, searchFromUrl, setSearchParams]);

  function setFilter(key, value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (!value || value === "all") {
          next.delete(key);
        } else {
          next.set(key, value);
        }

        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  function setPage(nextPage) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (nextPage <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(nextPage));
        }

        return next;
      },
      { replace: true },
    );
  }

  const employeeParams = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      role: role === "all" ? undefined : role,
      department_id: departmentId === "all" ? undefined : departmentId,
      status: status === "all" ? undefined : status,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, departmentId, page, role, status],
  );
  const employeesQuery = useEmployees(employeeParams);
  const departmentsQuery = useDepartments({});
  const employees = employeesQuery.data?.data ?? [];
  const meta = employeesQuery.data?.meta ?? {
    page,
    limit: PAGE_SIZE,
    total: employees.length,
  };
  const departments = departmentsQuery.data?.data ?? [];

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (employee) => <UserChip user={employee} />,
    },
    {
      key: "email",
      header: "Email",
      render: (employee) => (
        <span className="text-sm text-muted-foreground">{employee.email}</span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (employee) => employee.department_name ?? "—",
    },
    {
      key: "role",
      header: "Role",
      render: (employee) => <StatusBadge kind="role" value={employee.role} />,
    },
    {
      key: "allocations",
      header: "Active assets",
      render: (employee) => fmtNumber(employee.active_allocations),
    },
    {
      key: "status",
      header: "Status",
      render: (employee) => <StatusBadge kind="entity" value={employee.status} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      headerClassName: "w-24",
      cellClassName: "text-right",
      render: (employee) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setManagedEmployee(employee)}
          disabled={Boolean(departmentsQuery.error)}
        >
          <Settings2 aria-hidden="true" />
          Manage
        </Button>
      ),
    },
  ];

  return (
    <section className="space-y-5" aria-labelledby="employees-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="employees-heading" className="text-lg font-semibold text-foreground">
            Employee Directory
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign departments, manage account status, and control role promotion.
          </p>
        </div>
        {employeesQuery.isFetching && !employeesQuery.isPending ? (
          <p className="text-xs text-muted-foreground" role="status">
            Refreshing directory…
          </p>
        ) : null}
      </div>

      {departmentsQuery.error ? (
        <QueryErrorState
          title="Department options are unavailable"
          error={departmentsQuery.error}
          onRetry={() => void departmentsQuery.refetch()}
          compact
        />
      ) : null}

      <div className="grid gap-3 rounded-xl border border-border/80 bg-card p-3 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_13rem_13rem_11rem]">
        <label className="relative sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Search employees</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-9"
            placeholder="Search name or email…"
          />
        </label>

        <Select value={role} onValueChange={(value) => setFilter("role", value)}>
          <SelectTrigger className="h-11 w-full" aria-label="Employee role filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {Object.entries(ROLES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={departmentId}
          onValueChange={(value) => setFilter("department_id", value)}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Employee department filter">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => setFilter("status", value)}>
          <SelectTrigger className="h-11 w-full" aria-label="Employee status filter">
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
        rows={employees}
        caption="Organization employees"
        loading={employeesQuery.isPending}
        error={employeesQuery.error}
        onRetry={() => void employeesQuery.refetch()}
        emptyTitle="No employees found"
        emptyDescription="Change the directory filters to find another employee."
        page={meta.page}
        limit={meta.limit}
        total={meta.total}
        onPageChange={setPage}
        renderMobileCard={(employee) => (
          <Card className="border border-border/80 ring-0">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <UserChip user={employee} secondary={employee.email} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Manage ${employee.full_name}`}
                  onClick={() => setManagedEmployee(employee)}
                  disabled={Boolean(departmentsQuery.error)}
                >
                  <Settings2 aria-hidden="true" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge kind="role" value={employee.role} />
                <StatusBadge kind="entity" value={employee.status} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Department</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {employee.department_name ?? "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Active assets</dt>
                  <dd className="mt-1 inline-flex items-center gap-1 font-medium text-foreground">
                    <UsersRound className="size-3.5" aria-hidden="true" />
                    {fmtNumber(employee.active_allocations)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      />

      <ManageEmployeeDialog
        open={Boolean(managedEmployee)}
        onOpenChange={(open) => !open && setManagedEmployee(null)}
        employee={managedEmployee}
        departments={departments}
        currentUserId={user?.id}
        currentUserEmail={user?.email}
        onCurrentUserUpdated={refreshProfile}
      />
    </section>
  );
}
