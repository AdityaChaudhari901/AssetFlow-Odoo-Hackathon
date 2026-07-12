import { z } from "zod";

export const createAuditSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Enter an audit cycle name.")
      .max(120, "Cycle name must be 120 characters or fewer."),
    departmentId: z.string().optional(),
    location: z
      .string()
      .trim()
      .max(160, "Location must be 160 characters or fewer.")
      .optional(),
    dates: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }),
    auditorIds: z
      .array(z.string())
      .min(1, "Assign at least one auditor."),
  })
  .superRefine((values, context) => {
    if (!values.dates.from || !values.dates.to) {
      context.addIssue({
        code: "custom",
        path: ["dates"],
        message: "Choose a complete audit date range.",
      });
      return;
    }

    if (values.dates.to < values.dates.from) {
      context.addIssue({
        code: "custom",
        path: ["dates"],
        message: "The end date must be on or after the start date.",
      });
    }
  });
