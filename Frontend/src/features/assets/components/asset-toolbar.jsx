import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_STATUS } from "@/lib/constants";

export function AssetToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  categories,
  departments,
  canManage,
  onRegister,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search assets</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tag, name, serial, or location"
            className="h-11 pl-9"
          />
        </label>
        {canManage ? (
          <Button type="button" className="h-11" onClick={onRegister}>
            <Plus aria-hidden="true" />
            Register asset
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.category_id || "all"} onValueChange={(value) => onFilterChange("category_id", value === "all" ? "" : value)}>
          <SelectTrigger className="h-10 w-full" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}{category.status === "inactive" ? " (Inactive)" : ""}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={(value) => onFilterChange("status", value === "all" ? "" : value)}>
          <SelectTrigger className="h-10 w-full" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(ASSET_STATUS).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.department_id || "all"} onValueChange={(value) => onFilterChange("department_id", value === "all" ? "" : value)}>
          <SelectTrigger className="h-10 w-full" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}{department.status === "inactive" ? " (Inactive)" : ""}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.is_bookable || "all"} onValueChange={(value) => onFilterChange("is_bookable", value === "all" ? "" : value)}>
          <SelectTrigger className="h-10 w-full" aria-label="Filter by bookable status">
            <SelectValue placeholder="All asset types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All asset types</SelectItem>
            <SelectItem value="true">Bookable resources</SelectItem>
            <SelectItem value="false">Non-bookable assets</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
