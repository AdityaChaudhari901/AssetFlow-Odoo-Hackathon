import { z } from "zod";

export const allocationSchema = z.object({
  assetId: z.string().min(1, "Choose an asset."),
  targetType: z.enum(["employee", "department"]),
  targetId: z.string().min(1, "Choose a holder."),
  expectedReturnDate: z.string().optional(),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer.").optional(),
});

export const transferSchema = z.object({
  targetType: z.enum(["employee", "department"]),
  targetId: z.string().min(1, "Choose a transfer target."),
  reason: z.string().trim().max(500, "Reason must be 500 characters or fewer.").optional(),
});

export const returnSchema = z.object({
  condition: z.enum(["new", "good", "fair", "poor", "damaged"]),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer.").optional(),
});

export const rejectTransferSchema = z.object({
  reason: z.string().trim().max(500, "Reason must be 500 characters or fewer.").optional(),
});
