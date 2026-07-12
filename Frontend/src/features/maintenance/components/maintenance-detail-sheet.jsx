import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Play, UserRoundCheck, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  useApproveMaintenance,
  useAssignMaintenance,
  useMaintenanceDetail,
  useRejectMaintenance,
  useResolveMaintenance,
  useStartMaintenance,
} from "@/hooks/queries/use-maintenance";
import { fmtCurrency, fmtDateTime } from "@/lib/format";
import { applyValidationErrors } from "@/lib/forms";
import { MaintenanceStepper } from "@/features/maintenance/components/maintenance-stepper";
import {
  assignMaintenanceSchema,
  rejectMaintenanceSchema,
  resolveMaintenanceSchema,
} from "@/features/maintenance/schemas";

function ActionError({ error, onRefresh }) {
  if (!error) return null;
  return (
    <div className="space-y-2">
      <FormErrorAlert error={error} />
      {error.code === "ALREADY_PROCESSED" ? <Button type="button" size="sm" variant="outline" onClick={onRefresh}>Refresh workflow</Button> : null}
    </div>
  );
}

function RejectAction({ request, onDone, onRefresh }) {
  const mutation = useRejectMaintenance();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({ resolver: zodResolver(rejectMaintenanceSchema), defaultValues: { reason: "" } });
  useEffect(() => reset({ reason: "" }), [request.id, reset]);
  async function submit(values) {
    try {
      await mutation.mutateAsync({ id: request.id, payload: { reason: values.reason.trim() } });
      toast.success("Maintenance request rejected.");
      onDone();
    } catch (error) {
      if (!applyValidationErrors(error, setError, ["reason"])) setError("root.server", { ...error, message: error.message });
    }
  }
  return (
    <form className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4" onSubmit={handleSubmit(submit)} noValidate>
      <FormField id="maintenance-reject-reason" label="Rejection reason" error={errors.reason} required>{(props) => <Textarea {...props} rows={3} maxLength={500} disabled={mutation.isPending} {...register("reason")} />}</FormField>
      <ActionError error={errors.root?.server ?? mutation.error} onRefresh={onRefresh} />
      <div className="flex justify-end"><Button type="submit" variant="destructive" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <XCircle aria-hidden="true" />}{mutation.isPending ? "Rejecting…" : "Confirm rejection"}</Button></div>
    </form>
  );
}

function AssignAction({ request, onRefresh }) {
  const mutation = useAssignMaintenance();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({ resolver: zodResolver(assignMaintenanceSchema), defaultValues: { technicianName: "" } });
  useEffect(() => reset({ technicianName: request.technician_name ?? "" }), [request.id, request.technician_name, reset]);
  async function submit(values) {
    try {
      await mutation.mutateAsync({ id: request.id, payload: { technician_name: values.technicianName.trim() } });
      toast.success(`Assigned to ${values.technicianName.trim()}.`);
    } catch (error) {
      if (!applyValidationErrors(error, setError, ["technicianName"])) setError("root.server", { ...error, message: error.message });
    }
  }
  return (
    <form className="space-y-4 rounded-xl border border-border bg-muted/20 p-4" onSubmit={handleSubmit(submit)} noValidate>
      <FormField id="maintenance-technician" label="Technician name" error={errors.technicianName} required>{(props) => <Input {...props} className="h-11" maxLength={100} disabled={mutation.isPending} {...register("technicianName")} />}</FormField>
      <ActionError error={errors.root?.server ?? mutation.error} onRefresh={onRefresh} />
      <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <UserRoundCheck aria-hidden="true" />}{mutation.isPending ? "Assigning…" : "Assign technician"}</Button></div>
    </form>
  );
}

function ResolveAction({ request, onRefresh }) {
  const mutation = useResolveMaintenance();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({ resolver: zodResolver(resolveMaintenanceSchema), defaultValues: { resolutionNotes: "", cost: "" } });
  useEffect(() => reset({ resolutionNotes: "", cost: "" }), [request.id, reset]);
  async function submit(values) {
    try {
      const response = await mutation.mutateAsync({ id: request.id, payload: { resolution_notes: values.resolutionNotes?.trim() || null, cost: values.cost === "" ? null : Number(values.cost) } });
      const assetStatus = response.data.asset_status ?? response.data.asset?.status;
      toast.success(
        assetStatus
          ? `Resolved — asset returned to ${assetStatus}.`
          : "Resolved — the asset lifecycle was refreshed.",
      );
    } catch (error) {
      if (!applyValidationErrors(error, setError, ["resolutionNotes", "cost"])) setError("root.server", { ...error, message: error.message });
    }
  }
  return (
    <form className="space-y-4 rounded-xl border border-border bg-muted/20 p-4" onSubmit={handleSubmit(submit)} noValidate>
      <FormField id="maintenance-resolution" label="Resolution notes" error={errors.resolutionNotes}>{(props) => <Textarea {...props} rows={4} maxLength={1000} disabled={mutation.isPending} {...register("resolutionNotes")} />}</FormField>
      <FormField id="maintenance-cost" label="Repair cost (INR)" error={errors.cost}>{(props) => <Input {...props} className="h-11" inputMode="decimal" placeholder="0.00" disabled={mutation.isPending} {...register("cost")} />}</FormField>
      <ActionError error={errors.root?.server ?? mutation.error} onRefresh={onRefresh} />
      <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{mutation.isPending ? "Resolving…" : "Resolve request"}</Button></div>
    </form>
  );
}

function WorkflowActions({ request, canManage, onRefresh }) {
  const approveMutation = useApproveMaintenance();
  const startMutation = useStartMaintenance();
  const [rejecting, setRejecting] = useState(false);
  const allowed = request.allowed_actions ?? ({
    pending: ["approve", "reject"],
    approved: ["assign"],
    assigned: ["start"],
    in_progress: ["resolve"],
  }[request.status] ?? []);

  useEffect(() => setRejecting(false), [request.id, request.status]);

  if (!canManage || allowed.length === 0) return null;

  async function approve() {
    try {
      await approveMutation.mutateAsync({ id: request.id });
      toast.success(`Approved — ${request.asset.asset_tag} is now Under Maintenance.`);
    } catch (error) {
      toast.error(error?.message ?? "The request could not be approved.");
      if (error?.code === "ALREADY_PROCESSED") await onRefresh();
    }
  }

  async function start() {
    try {
      await startMutation.mutateAsync({ id: request.id });
      toast.success("Maintenance work started.");
    } catch (error) {
      toast.error(error?.message ?? "Maintenance could not be started.");
      if (error?.code === "ALREADY_PROCESSED") await onRefresh();
    }
  }

  return (
    <section className="space-y-3 border-t border-border pt-5" aria-labelledby="maintenance-actions-heading">
      <div><h3 id="maintenance-actions-heading" className="font-semibold">Next workflow action</h3><p className="text-xs text-muted-foreground">Changes are applied only after the server confirms the transition.</p></div>
      {allowed.includes("approve") ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={approveMutation.isPending} onClick={approve}>{approveMutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}Approve request</Button>
          <Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={approveMutation.isPending} onClick={() => setRejecting((value) => !value)}><XCircle aria-hidden="true" />Reject</Button>
        </div>
      ) : null}
      {rejecting ? <RejectAction request={request} onDone={() => setRejecting(false)} onRefresh={onRefresh} /> : null}
      {allowed.includes("assign") ? <AssignAction request={request} onRefresh={onRefresh} /> : null}
      {allowed.includes("start") ? <Button type="button" disabled={startMutation.isPending} onClick={start}>{startMutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}{startMutation.isPending ? "Starting…" : "Start maintenance"}</Button> : null}
      {allowed.includes("resolve") ? <ResolveAction request={request} onRefresh={onRefresh} /> : null}
    </section>
  );
}

export function MaintenanceDetailSheet({ requestId, open, onOpenChange, canManage }) {
  const query = useMaintenanceDetail(requestId);
  const request = query.data?.data;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-border pr-12">
          <SheetTitle>Maintenance request</SheetTitle>
          <SheetDescription>{request ? `${request.asset.asset_tag} · ${request.asset.name}` : "Workflow details and approved actions."}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-8">
          {query.isLoading ? <div className="space-y-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-28 rounded-xl" /></div> : null}
          {query.error ? <QueryErrorState error={query.error} onRetry={query.refetch} /> : null}
          {request ? (
            <>
              <section className="space-y-4">
                <div className="flex flex-wrap gap-2"><StatusBadge kind="priority" value={request.priority} /><StatusBadge kind="maintenance" value={request.status} /></div>
                <div><h2 className="text-xl font-semibold tracking-tight">{request.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{request.description || "No description was provided."}</p></div>
                <dl className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Raised by</dt><dd className="mt-1 font-medium">{request.raised_by.full_name}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Raised</dt><dd className="mt-1"><RelativeTime value={request.created_at} /></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Last updated</dt><dd className="mt-1">{fmtDateTime(request.updated_at)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Technician</dt><dd className="mt-1 font-medium">{request.technician_name || "Not assigned"}</dd></div>
                  {request.cost ? <div><dt className="text-xs text-muted-foreground">Repair cost</dt><dd className="mt-1 font-medium">{fmtCurrency(request.cost)}</dd></div> : null}
                </dl>
                {request.photo_url ? <a href={request.photo_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border"><img src={request.photo_url} alt={`Evidence for ${request.title}`} className="max-h-64 w-full object-cover" /></a> : null}
                {request.rejection_reason ? <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-destructive">Rejection reason</p><p className="mt-2 text-sm">{request.rejection_reason}</p></div> : null}
                {request.resolution_notes ? <div className="rounded-xl border border-success-border bg-success-surface p-4"><p className="text-xs font-semibold uppercase tracking-wide text-success">Resolution</p><p className="mt-2 text-sm">{request.resolution_notes}</p></div> : null}
              </section>
              <section className="space-y-3"><h3 className="font-semibold">Workflow</h3><MaintenanceStepper status={request.status} /></section>
              <WorkflowActions request={request} canManage={canManage} onRefresh={query.refetch} />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
