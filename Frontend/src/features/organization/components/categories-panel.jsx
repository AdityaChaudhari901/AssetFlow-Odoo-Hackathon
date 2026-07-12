import { useMemo, useState } from "react";
import { ListChecks, Plus, Shapes } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryDialog } from "@/features/organization/components/category-dialog";
import { OrganizationRowActions } from "@/features/organization/components/organization-row-actions";
import {
  useCategories,
  useUpdateCategory,
} from "@/hooks/queries/use-organization";
import { fmtNumber } from "@/lib/format";

export function CategoriesPanel() {
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const params = useMemo(
    () => ({ status: status === "all" ? undefined : status }),
    [status],
  );
  const categoriesQuery = useCategories(params);
  const statusMutation = useUpdateCategory();
  const categories = categoriesQuery.data?.data ?? [];

  function openCreate() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEdit(category) {
    setEditingCategory(category);
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
      toast.error(error.message ?? "Category status could not be changed.");
    }
  }

  const columns = [
    {
      key: "name",
      header: "Category",
      render: (category) => (
        <div>
          <p className="font-medium text-foreground">{category.name}</p>
          <p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">
            {category.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      key: "customFields",
      header: "Custom fields",
      render: (category) => fmtNumber(category.custom_fields?.length ?? 0),
    },
    {
      key: "fieldTypes",
      header: "Metadata",
      render: (category) => (
        <span className="text-xs text-muted-foreground">
          {[...new Set(category.custom_fields?.map((field) => field.type) ?? [])]
            .join(", ") || "Standard fields"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (category) => <StatusBadge kind="entity" value={category.status} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      headerClassName: "w-12",
      cellClassName: "text-right",
      render: (category) => (
        <OrganizationRowActions
          active={category.status === "active"}
          ariaLabel={`Actions for ${category.name}`}
          onEdit={() => openEdit(category)}
          onToggleStatus={() => setStatusTarget(category)}
        />
      ),
    },
  ];

  return (
    <section className="space-y-5" aria-labelledby="categories-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="categories-heading" className="text-lg font-semibold text-foreground">
            Asset categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Standardize asset metadata and registration requirements.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus aria-hidden="true" />
          Add category
        </Button>
      </div>

      <div className="flex justify-end rounded-xl border border-border/80 bg-card p-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full sm:w-52" aria-label="Category status filter">
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
        rows={categories}
        caption="Asset categories"
        loading={categoriesQuery.isPending}
        error={categoriesQuery.error}
        onRetry={() => void categoriesQuery.refetch()}
        emptyTitle="No categories found"
        emptyDescription="Change the filter or create the first category."
        emptyAction={<Button onClick={openCreate}>Add category</Button>}
        renderMobileCard={(category) => (
          <Card className="border border-border/80 ring-0">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <Shapes className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{category.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {category.description || "No description"}
                    </p>
                  </div>
                </div>
                <OrganizationRowActions
                  active={category.status === "active"}
                  ariaLabel={`Actions for ${category.name}`}
                  onEdit={() => openEdit(category)}
                  onToggleStatus={() => setStatusTarget(category)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge kind="entity" value={category.status} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ListChecks className="size-3.5" aria-hidden="true" />
                  {fmtNumber(category.custom_fields?.length ?? 0)} custom fields
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && !statusMutation.isPending && setStatusTarget(null)}
        title={`${statusTarget?.status === "active" ? "Deactivate" : "Activate"} category?`}
        description={
          statusTarget?.status === "active"
            ? `${statusTarget?.name} remains on existing assets but cannot be selected for new registrations.`
            : `${statusTarget?.name} becomes available for new asset registrations.`
        }
        confirmLabel={statusTarget?.status === "active" ? "Deactivate" : "Activate"}
        destructive={statusTarget?.status === "active"}
        pending={statusMutation.isPending}
        onConfirm={toggleStatus}
      />
    </section>
  );
}
