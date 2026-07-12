import { Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CUSTOM_FIELD_TYPES } from "@/features/organization/organization-schemas";

const EMPTY_FIELD = {
  key: "",
  label: "",
  type: "text",
  required: false,
};

export function CustomFieldsEditor({ control, register, errors, disabled }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "customFields",
  });
  const collectionError = errors?.root?.message ?? errors?.message;

  return (
    <fieldset
      className="space-y-3"
      disabled={disabled}
      aria-describedby={collectionError ? "custom-fields-error" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <legend className="text-sm font-medium text-foreground">Custom fields</legend>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            These fields appear when an asset is registered in this category.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= 20}
          onClick={() => append({ ...EMPTY_FIELD })}
        >
          <Plus aria-hidden="true" />
          Add field
        </Button>
      </div>

      {collectionError ? (
        <p id="custom-fields-error" className="text-xs text-destructive">{collectionError}</p>
      ) : null}

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
          No custom fields. Asset registration will use the standard fields only.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const fieldErrors = errors?.[index];

            return (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_9rem_auto]"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor={`custom-field-key-${index}`}
                    className="text-xs font-medium text-foreground"
                  >
                    Key
                  </label>
                  <Input
                    id={`custom-field-key-${index}`}
                    className="h-10"
                    placeholder="warranty_expiry"
                    aria-invalid={fieldErrors?.key ? true : undefined}
                    aria-describedby={fieldErrors?.key ? `custom-field-key-${index}-error` : undefined}
                    {...register(`customFields.${index}.key`)}
                  />
                  {fieldErrors?.key ? (
                    <p id={`custom-field-key-${index}-error`} className="text-xs text-destructive">{fieldErrors.key.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`custom-field-label-${index}`}
                    className="text-xs font-medium text-foreground"
                  >
                    Label
                  </label>
                  <Input
                    id={`custom-field-label-${index}`}
                    className="h-10"
                    placeholder="Warranty expiry"
                    aria-invalid={fieldErrors?.label ? true : undefined}
                    aria-describedby={fieldErrors?.label ? `custom-field-label-${index}-error` : undefined}
                    {...register(`customFields.${index}.label`)}
                  />
                  {fieldErrors?.label ? (
                    <p id={`custom-field-label-${index}-error`} className="text-xs text-destructive">{fieldErrors.label.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Type</span>
                  <Controller
                    control={control}
                    name={`customFields.${index}.type`}
                    render={({ field: typeField }) => (
                      <Select value={typeField.value} onValueChange={typeField.onChange}>
                        <SelectTrigger ref={typeField.ref} onBlur={typeField.onBlur} className="h-10 w-full" aria-label="Custom field type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CUSTOM_FIELD_TYPES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-center">
                  <Controller
                    control={control}
                    name={`customFields.${index}.required`}
                    render={({ field: requiredField }) => (
                      <label className="flex h-10 items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          ref={requiredField.ref}
                          checked={requiredField.value}
                          onCheckedChange={requiredField.onChange}
                          onBlur={requiredField.onBlur}
                          aria-label={`Require ${field.label || `custom field ${index + 1}`}`}
                        />
                        Required
                      </label>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Remove custom field ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
