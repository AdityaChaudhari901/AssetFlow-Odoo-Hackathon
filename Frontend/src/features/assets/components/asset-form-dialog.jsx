import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/shared/date-picker";
import { FileUpload } from "@/components/shared/file-upload";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { SearchSelect } from "@/components/shared/search-select";
import { useCreateAsset, useUpdateAsset } from "@/hooks/queries/use-assets";
import { CONDITION } from "@/lib/constants";
import { applyValidationErrors, setApiFieldError } from "@/lib/forms";
import { titleCase } from "@/lib/format";
import { assetSchema, validateCustomFields } from "@/features/assets/asset-schemas";
import { assetToFormValues, formValuesToAssetPayload } from "@/features/assets/asset-values";

function DynamicFields({ category, control, register, errors, disabled }) {
  if (!category?.custom_fields?.length) {
    return null;
  }

  return (
    <fieldset className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
      <legend className="px-1 text-sm font-semibold">Category details</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {category.custom_fields.map((field) => {
          const name = `customFieldValues.${field.key}`;
          const error = errors?.customFieldValues?.[field.key];

          if (field.type === "boolean") {
            return (
              <FormField key={field.key} id={`asset-${field.key}`} label={field.label} error={error}>
                {(fieldProps) => (
                  <Controller
                    control={control}
                    name={name}
                    render={({ field: controllerField }) => (
                      <div className="flex h-11 items-center justify-between rounded-lg border border-input px-3">
                        <span className="text-sm text-muted-foreground">
                          {controllerField.value ? "Yes" : "No"}
                        </span>
                        <Switch
                          ref={controllerField.ref}
                          checked={Boolean(controllerField.value)}
                          onCheckedChange={controllerField.onChange}
                          onBlur={controllerField.onBlur}
                          disabled={disabled}
                          aria-label={field.label}
                          {...fieldProps}
                        />
                      </div>
                    )}
                  />
                )}
              </FormField>
            );
          }

          if (field.type === "date") {
            return (
              <FormField key={field.key} id={`asset-${field.key}`} label={field.label} error={error} required={field.required}>
                {(fieldProps) => (
                  <Controller
                    control={control}
                    name={name}
                    render={({ field: controllerField }) => (
                      <DatePicker
                        {...fieldProps}
                        ref={controllerField.ref}
                        value={controllerField.value ?? ""}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                        disabled={disabled}
                      />
                    )}
                  />
                )}
              </FormField>
            );
          }

          return (
            <FormField key={field.key} id={`asset-${field.key}`} label={field.label} error={error} required={field.required}>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type={field.type === "number" ? "number" : "text"}
                  className="h-11"
                  disabled={disabled}
                  {...register(name)}
                />
              )}
            </FormField>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AssetFormDialog({
  open,
  onOpenChange,
  asset = null,
  categories = [],
  departments = [],
}) {
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const editing = Boolean(asset);
  const mutation = editing ? updateMutation : createMutation;
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: assetToFormValues(asset),
  });

  useEffect(() => {
    if (open) {
      reset(assetToFormValues(asset));
      clearErrors();
      setUploadingPhoto(false);
    }
  }, [asset, clearErrors, open, reset]);

  const categoryId = watch("categoryId");
  const selectedCategory = categories.find((category) => category.id === categoryId);

  async function submit(values) {
    if (uploadingPhoto) {
      return;
    }
    clearErrors("root.server");

    if (!validateCustomFields(selectedCategory, values.customFieldValues, setError)) {
      return;
    }

    try {
      const payload = formValuesToAssetPayload(values, selectedCategory);
      const response = editing
        ? await updateMutation.mutateAsync({ id: asset.id, payload })
        : await createMutation.mutateAsync(payload);
      toast.success(
        editing
          ? `${response.data.asset_tag} updated.`
          : `Asset ${response.data.asset_tag} registered.`,
      );
      onOpenChange(false);
    } catch (error) {
      if (error?.code === "DUPLICATE_RESOURCE") {
        setApiFieldError(setError, error?.details?.field === "serial_number" ? "serialNumber" : "name", error);
        return;
      }

      if (applyValidationErrors(error, setError, [
        "name",
        "categoryId",
        "serialNumber",
        "acquisitionDate",
        "acquisitionCost",
        "condition",
        "location",
        "departmentId",
        "customFieldValues",
        "imageUrl",
      ])) {
        return;
      }

      setError("root.server", {
        type: error?.code ?? "server",
        message: error?.message ?? "The asset could not be saved.",
        requestId: error?.requestId,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && !uploadingPhoto && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit asset passport" : "Register an asset"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update descriptive details without changing lifecycle custody."
              : "Create the permanent identity record before allocating or booking the asset."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit(submit)} noValidate>
          <div className="grid min-h-0 gap-4 overflow-y-auto px-0.5 pb-5 sm:grid-cols-2">
            <FormField id="asset-name" label="Asset name" error={errors.name} required>
              {(fieldProps) => (
                <Input {...fieldProps} className="h-11" disabled={mutation.isPending} {...register("name")} />
              )}
            </FormField>

            <FormField id="asset-category" label="Category" error={errors.categoryId} required>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <SearchSelect
                      {...fieldProps}
                      ref={field.ref}
                      value={field.value}
                      onValueChange={(nextValue) => {
                        if (field.value && field.value !== nextValue && Object.keys(watch("customFieldValues") ?? {}).length) {
                          toast.info("Category-specific values were cleared.");
                          setValue("customFieldValues", {});
                        }
                        field.onChange(nextValue);
                      }}
                      onBlur={field.onBlur}
                      options={categories
                        .filter(
                          (item) =>
                            item.status !== "inactive" ||
                            item.id === asset?.category?.id,
                        )
                        .map((item) => ({
                          value: item.id,
                          label: `${item.name}${item.status === "inactive" ? " (Inactive)" : ""}`,
                        }))}
                      placeholder="Choose category"
                      disabled={mutation.isPending}
                    />
                  )}
                />
              )}
            </FormField>

            <FormField id="asset-serial" label="Serial number" error={errors.serialNumber}>
              {(fieldProps) => (
                <Input {...fieldProps} className="h-11" disabled={mutation.isPending} {...register("serialNumber")} />
              )}
            </FormField>

            <FormField id="asset-condition" label="Condition" error={errors.condition} required>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="condition"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                      <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION.map((condition) => (
                          <SelectItem key={condition} value={condition}>{titleCase(condition)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField id="asset-acquisition-date" label="Acquisition date" error={errors.acquisitionDate}>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="acquisitionDate"
                  render={({ field }) => (
                    <DatePicker {...fieldProps} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={mutation.isPending} />
                  )}
                />
              )}
            </FormField>

            <FormField id="asset-cost" label="Acquisition cost (INR)" error={errors.acquisitionCost}>
              {(fieldProps) => (
                <Input {...fieldProps} type="number" min="0" step="1" className="h-11" disabled={mutation.isPending} {...register("acquisitionCost")} />
              )}
            </FormField>

            <FormField id="asset-location" label="Location" error={errors.location}>
              {(fieldProps) => (
                <Input {...fieldProps} className="h-11" disabled={mutation.isPending} {...register("location")} />
              )}
            </FormField>

            <FormField id="asset-department" label="Department" error={errors.departmentId}>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <SearchSelect
                      {...fieldProps}
                      ref={field.ref}
                      value={field.value || "unassigned"}
                      onValueChange={(nextValue) =>
                        field.onChange(nextValue === "unassigned" ? "" : nextValue)
                      }
                      onBlur={field.onBlur}
                      options={[
                        { value: "unassigned", label: "Unassigned" },
                        ...departments
                          .filter(
                            (item) =>
                              item.status !== "inactive" ||
                              item.id === asset?.department?.id,
                          )
                          .map((item) => ({
                            value: item.id,
                            label: `${item.name}${item.status === "inactive" ? " (Inactive)" : ""}`,
                          })),
                      ]}
                      placeholder="Choose department"
                      disabled={mutation.isPending}
                    />
                  )}
                />
              )}
            </FormField>

            <div className="sm:col-span-2">
              <Controller
                control={control}
                name="isBookable"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div>
                      <p className="text-sm font-medium">Shared / bookable resource</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Allow employees to reserve this asset on the booking calendar.
                      </p>
                    </div>
                    <Switch ref={field.ref} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} disabled={mutation.isPending} aria-label="Shared or bookable resource" />
                  </div>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <FormField id="asset-image" label="Asset photo" error={errors.imageUrl}>
                {() => (
                  <Controller
                    control={control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                        folder="assets"
                        disabled={mutation.isPending}
                        label="Upload asset photo"
                        accept="image/jpeg,image/png,image/webp"
                        onUploadingChange={setUploadingPhoto}
                      />
                    )}
                  />
                )}
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <DynamicFields
                category={selectedCategory}
                control={control}
                register={register}
                errors={errors}
                disabled={mutation.isPending}
              />
            </div>

            <div className="sm:col-span-2">
              <FormErrorAlert error={errors.root?.server} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending || uploadingPhoto} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || uploadingPhoto}>
              {mutation.isPending || uploadingPhoto ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {uploadingPhoto ? "Uploading photo…" : mutation.isPending ? "Saving…" : editing ? "Save changes" : "Register asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
