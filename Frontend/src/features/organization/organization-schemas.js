import { z } from "zod";

import { APP_ROLES } from "@/lib/constants";

export const CUSTOM_FIELD_TYPES = Object.freeze([
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes / No" },
]);

const optionalId = z.string().trim().optional();

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a department name.")
    .max(100, "Department name must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional(),
  headId: optionalId,
  parentDepartmentId: optionalId,
});

const customFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Enter a field key.")
    .max(64, "Field key must be 64 characters or fewer.")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Use lowercase letters, numbers, and underscores; start with a letter.",
    ),
  label: z
    .string()
    .trim()
    .min(1, "Enter a field label.")
    .max(100, "Field label must be 100 characters or fewer."),
  type: z.enum(["text", "number", "date", "boolean"]),
  required: z.boolean(),
});

export const categorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter a category name.")
      .max(100, "Category name must be 100 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer.")
      .optional(),
    customFields: z.array(customFieldSchema).max(20, "Use no more than 20 custom fields."),
  })
  .superRefine((values, context) => {
    const seen = new Set();

    values.customFields.forEach((field, index) => {
      if (seen.has(field.key)) {
        context.addIssue({
          code: "custom",
          path: ["customFields", index, "key"],
          message: "Each custom-field key must be unique.",
        });
      }

      seen.add(field.key);
    });
  });

export const employeeSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the employee's full name.")
    .max(100, "Full name must be 100 characters or fewer."),
  role: z.enum([
    APP_ROLES.ADMIN,
    APP_ROLES.ASSET_MANAGER,
    APP_ROLES.DEPARTMENT_HEAD,
    APP_ROLES.EMPLOYEE,
  ]),
  departmentId: optionalId,
  active: z.boolean(),
});

export function departmentPayload(values) {
  return {
    name: values.name,
    description: values.description || null,
    head_id: values.headId || null,
    parent_department_id: values.parentDepartmentId || null,
  };
}

export function categoryPayload(values) {
  return {
    name: values.name,
    description: values.description || null,
    custom_fields: values.customFields,
  };
}

export function employeePayload(values, { protectSelf = false } = {}) {
  const payload = {
    full_name: values.fullName,
    department_id: values.departmentId || null,
  };

  if (!protectSelf) {
    payload.role = values.role;
    payload.status = values.active ? "active" : "inactive";
  }

  return payload;
}
