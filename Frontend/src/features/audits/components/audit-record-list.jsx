import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserChip } from "@/components/shared/user-chip";

const RESULTS = ["verified", "missing", "damaged"];

function AuditRecord({ record, editable, disabled, saving, error, onSave }) {
  const [result, setResult] = useState(record.result === "pending" ? "verified" : record.result);
  const [notes, setNotes] = useState(record.notes ?? "");

  useEffect(() => {
    setResult(record.result === "pending" ? "verified" : record.result);
    setNotes(record.notes ?? "");
  }, [record.notes, record.result]);

  return (
    <article className="rounded-xl border border-border/80 bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tabular-nums text-primary">{record.asset.asset_tag}</p>
          <h3 className="mt-1 font-semibold text-foreground">{record.asset.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Expected at {record.asset.location || "unspecified location"}</p>
        </div>
        <StatusBadge kind="audit" value={record.result} />
      </div>

      {editable ? (
        <div className="mt-5 space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Verification result</legend>
            <div className="grid grid-cols-3 gap-2">
              {RESULTS.map((value) => (
                <Button key={value} type="button" variant={result === value ? "default" : "outline"} className="h-11" aria-pressed={result === value} onClick={() => setResult(value)} disabled={disabled}>
                  {value[0].toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="space-y-2">
            <label htmlFor={`audit-note-${record.id}`} className="text-sm font-medium">Evidence notes</label>
            <Textarea id={`audit-note-${record.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record what was observed" maxLength={1000} disabled={disabled} />
          </div>
          <FormErrorAlert error={error} />
          <Button type="button" className="h-11" onClick={() => onSave({ asset_id: record.asset.id, result, notes })} disabled={disabled}>
            {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {saving ? "Saving…" : "Save verification"}
          </Button>
        </div>
      ) : (
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="text-sm leading-6 text-muted-foreground">{record.notes || "No evidence notes recorded."}</p>
          {record.audited_by ? <UserChip user={record.audited_by} secondary={record.audited_at ? new Date(record.audited_at).toLocaleString() : undefined} compact className="mt-3" /> : null}
        </div>
      )}
    </article>
  );
}

export function AuditRecordList({ records = [], editable, mutation }) {
  return (
    <div className="space-y-3">
      {records.map((record) => (
        <AuditRecord
          key={record.id}
          record={record}
          editable={editable}
          disabled={mutation.isPending}
          saving={mutation.isPending && mutation.variables?.asset_id === record.asset.id}
          error={mutation.error && mutation.variables?.asset_id === record.asset.id ? mutation.error : null}
          onSave={(payload) =>
            mutation.mutate(payload, {
              onError: (error) => {
                if (error?.code === "AUDIT_CYCLE_CLOSED") {
                  toast.error("This audit cycle was closed elsewhere. The evidence was refreshed.");
                }
              },
            })
          }
        />
      ))}
    </div>
  );
}
