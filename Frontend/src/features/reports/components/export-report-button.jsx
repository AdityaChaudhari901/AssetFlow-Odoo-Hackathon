import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportReport } from "@/api/reports";

export function ExportReportButton({ report, params = {}, label = "Export CSV" }) {
  const [pending, setPending] = useState(false);

  async function downloadReport() {
    setPending(true);
    try {
      const blob = await exportReport(report, params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `assetflow-${report}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message ?? "The report could not be exported.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="h-11" disabled={pending} onClick={downloadReport}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
      {pending ? "Preparing CSV…" : label}
    </Button>
  );
}
