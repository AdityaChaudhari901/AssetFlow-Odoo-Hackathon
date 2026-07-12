import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/shared/file-upload";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { useAsset, useAssets } from "@/hooks/queries/use-assets";
import { useCreateMaintenance } from "@/hooks/queries/use-maintenance";
import { applyValidationErrors } from "@/lib/forms";
import { titleCase } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { raiseMaintenanceSchema } from "@/features/maintenance/schemas";

const DEFAULT_VALUES = { assetId: "", title: "", description: "", priority: "medium", photoUrl: null };

export function RaiseMaintenanceDialog({ open, onOpenChange, assetId = "" }) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const debouncedAssetSearch = useDebouncedValue(assetSearch);
  const assetsQuery = useAssets(
    { search: debouncedAssetSearch || undefined, limit: 50 },
    { enabled: open },
  );
  const prefilledAssetQuery = useAsset(open ? assetId : null);
  const mutation = useCreateMaintenance();
  const { register, control, handleSubmit, reset, setError, clearErrors, formState: { errors } } = useForm({
    resolver: zodResolver(raiseMaintenanceSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset({ ...DEFAULT_VALUES, assetId });
      clearErrors();
      mutation.reset();
      setUploadingPhoto(false);
      setAssetSearch("");
    }
  }, [assetId, clearErrors, open, reset]);

  const listedAssets = assetsQuery.data?.data ?? [];
  const prefilledAsset = prefilledAssetQuery.data?.data;
  const assets = [
    ...(prefilledAsset && !listedAssets.some((asset) => asset.id === prefilledAsset.id)
      ? [prefilledAsset]
      : []),
    ...listedAssets,
  ].filter((asset) => !["retired", "disposed"].includes(asset.status));

  async function submit(values) {
    if (uploadingPhoto) return;
    clearErrors("root.server");
    try {
      const selectedAsset = assets.find((item) => item.id === values.assetId);
      await mutation.mutateAsync({
        asset_id: values.assetId,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        priority: values.priority,
        photo_url: values.photoUrl || null,
      });
      toast.success(
        selectedAsset?.asset_tag
          ? `Maintenance request raised for ${selectedAsset.asset_tag}.`
          : "Maintenance request raised.",
      );
      onOpenChange(false);
    } catch (error) {
      if (!applyValidationErrors(error, setError, ["assetId", "title", "description", "priority", "photoUrl"])) {
        setError("root.server", { type: error?.code ?? "server", message: error?.message ?? "The request could not be raised.", requestId: error?.requestId });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && !uploadingPhoto && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Raise maintenance request</DialogTitle><DialogDescription>Report the issue before repair work changes the asset lifecycle state.</DialogDescription></DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <Controller control={control} name="assetId" render={({ field }) => (
            <FormField id="maintenance-asset" label="Asset" error={errors.assetId} required>
              {(fieldProps) => <SearchSelect {...fieldProps} ref={field.ref} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} options={assets.map((asset) => ({ value: asset.id, label: `${asset.asset_tag} · ${asset.name}`, keywords: asset.category?.name }))} placeholder="Choose asset" searchValue={assetSearch} onSearchChange={setAssetSearch} loading={assetsQuery.isLoading} disabled={mutation.isPending} />}
            </FormField>
          )} />
          <FormField id="maintenance-title" label="Issue title" error={errors.title} required>
            {(fieldProps) => <Input {...fieldProps} className="h-11" maxLength={120} disabled={mutation.isPending} {...register("title")} />}
          </FormField>
          <FormField id="maintenance-description" label="Description" error={errors.description}>
            {(fieldProps) => <Textarea {...fieldProps} rows={4} maxLength={1000} disabled={mutation.isPending} {...register("description")} />}
          </FormField>
          <Controller control={control} name="priority" render={({ field }) => (
            <FormField id="maintenance-priority" label="Priority" error={errors.priority} required>
              {(fieldProps) => <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}><SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{["low", "medium", "high", "critical"].map((priority) => <SelectItem key={priority} value={priority}>{titleCase(priority)}</SelectItem>)}</SelectContent></Select>}
            </FormField>
          )} />
          <Controller control={control} name="photoUrl" render={({ field }) => (
            <FormField id="maintenance-photo" label="Photo evidence" error={errors.photoUrl}>
              {() => <FileUpload value={field.value} onChange={field.onChange} folder="maintenance" disabled={mutation.isPending} label="Upload photo evidence" accept="image/jpeg,image/png,image/webp" onUploadingChange={setUploadingPhoto} />}
            </FormField>
          )} />
          <FormErrorAlert error={errors.root?.server ?? mutation.error ?? assetsQuery.error ?? prefilledAssetQuery.error} />
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending || uploadingPhoto} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending || uploadingPhoto || Boolean(assetsQuery.error) || Boolean(prefilledAssetQuery.error)}>{mutation.isPending || uploadingPhoto ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{uploadingPhoto ? "Uploading photo…" : mutation.isPending ? "Submitting…" : "Raise request"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
