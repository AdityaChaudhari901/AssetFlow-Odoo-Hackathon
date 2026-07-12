import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().trim().min(2, "Enter an asset name.").max(120),
  categoryId: z.string().min(1, "Choose a category."),
  serialNumber: z.string().trim().max(120).optional(),
  acquisitionDate: z.string().optional(),
  acquisitionCost: z
    .string()
    .trim()
    .refine((value) => !value || (Number.isFinite(Number(value)) && Number(value) >= 0), {
      message: "Enter a valid non-negative amount.",
    }),
  condition: z.enum(["new", "good", "fair", "poor", "damaged"]),
  location: z.string().trim().max(160).optional(),
  departmentId: z.string().optional(),
  isBookable: z.boolean(),
  imageUrl: z.string().nullable().optional(),
  customFieldValues: z.record(z.string(), z.unknown()),
});

export const assetStatusSchema = z.object({
  status: z.string().min(1, "Choose a lifecycle status."),
  notes: z.string().trim().max(500).optional(),
});

export function validateCustomFields(category, values, setError) {
  let valid = true;

  for (const field of category?.custom_fields ?? []) {
    const value = values?.[field.key];
    const missing = value === undefined || value === null || value === "";

    if (field.required && missing) {
      setError(`customFieldValues.${field.key}`, {
        type: "required",
        message: `${field.label} is required.`,
      });
      valid = false;
      continue;
    }

    if (!missing && field.type === "number" && !Number.isFinite(Number(value))) {
      setError(`customFieldValues.${field.key}`, {
        type: "validate",
        message: `${field.label} must be a number.`,
      });
      valid = false;
    }
  }

  return valid;
}
