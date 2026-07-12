import { z } from "zod";

export const bookingSchema = z
  .object({
    assetId: z.string().min(1, "Choose a resource."),
    date: z
      .string()
      .min(1, "Choose a date.")
      .refine(
        (value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()),
        "Choose a valid date.",
      ),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid start time."),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid end time."),
    purpose: z.string().trim().max(300, "Purpose must be 300 characters or fewer.").optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ["endTime"],
    message: "End time must be after start time.",
  })
  .refine(
    (value) =>
      new Date(`${value.date}T${value.startTime}:00`).getTime() > Date.now(),
    {
      path: ["startTime"],
      message: "Choose a future booking time.",
    },
  );

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300, "Reason must be 300 characters or fewer.").optional(),
});
