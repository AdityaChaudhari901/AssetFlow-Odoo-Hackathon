import { z } from "zod";

export const raiseMaintenanceSchema = z.object({
  assetId: z.string().min(1, "Choose an asset."),
  title: z.string().trim().min(3, "Enter a title with at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z.string().trim().max(1000, "Description must be 1,000 characters or fewer.").optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  photoUrl: z.string().url("Upload a valid attachment.").nullable().optional(),
});

export const rejectMaintenanceSchema = z.object({
  reason: z.string().trim().min(3, "Explain why this request is being rejected.").max(500, "Reason must be 500 characters or fewer."),
});

export const assignMaintenanceSchema = z.object({
  technicianName: z.string().trim().min(2, "Enter the technician name.").max(100, "Technician name must be 100 characters or fewer."),
});

export const resolveMaintenanceSchema = z.object({
  resolutionNotes: z.string().trim().max(1000, "Resolution notes must be 1,000 characters or fewer.").optional(),
  cost: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0), "Enter a valid non-negative cost."),
});
