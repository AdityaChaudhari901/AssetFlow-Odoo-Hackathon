import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { cn } from "@/lib/utils";

function TableSkeleton({ columns, rows = 5 }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <TableRow key={`skeleton-${rowIndex}`}>
      {columns.map((column) => (
        <TableCell key={column.key}>
          <Skeleton className="h-5 w-full max-w-36" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export function DataTable({
  columns,
  rows = [],
  rowKey = "id",
  caption,
  loading = false,
  error,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "Try changing your filters or create the first record.",
  emptyAction,
  renderMobileCard,
  onRowClick,
  getRowClassName,
  page = 1,
  limit = 20,
  total = rows.length,
  onPageChange,
  className,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPagination = Boolean(onPageChange && total > limit);

  if (error) {
    return <QueryErrorState error={error} onRetry={onRetry} />;
  }

  if (!loading && rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("overflow-hidden rounded-xl border border-border/80 bg-card", renderMobileCard && "hidden md:block")}>
        <Table>
          {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
          <TableHeader className="bg-muted/35">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={columns} />
            ) : (
              rows.map((row) => (
                <TableRow
                  key={typeof rowKey === "function" ? rowKey(row) : row[rowKey]}
                  className={cn(
                    onRowClick && "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none",
                    getRowClassName?.(row),
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (["Enter", " "].includes(event.key) && event.target === event.currentTarget) {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.cellClassName}>
                      {column.render ? column.render(row) : row[column.key] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {renderMobileCard ? (
        <div className="grid gap-3 md:hidden">
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-40 rounded-xl" />
              ))
            : rows.map((row) => (
                <div key={typeof rowKey === "function" ? rowKey(row) : row[rowKey]}>
                  {renderMobileCard(row)}
                </div>
              ))}
        </div>
      ) : null}

      {hasPagination ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs tabular-nums text-muted-foreground">
            Page {page} of {totalPages} · {total} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
