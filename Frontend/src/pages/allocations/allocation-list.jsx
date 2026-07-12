import { PagePlaceholder } from "@/components/shared/page-placeholder";

export function AllocationListPage() {
  return (
    <PagePlaceholder
      eyebrow="Custody control"
      title="Allocations & Transfers"
      description="Track who holds each asset, manage returns, and route transfer approvals without allowing duplicate custody."
      nextStep="F4 implements allocation, the judged conflict flow, transfer decisions, returns, and overdue states."
    />
  );
}
