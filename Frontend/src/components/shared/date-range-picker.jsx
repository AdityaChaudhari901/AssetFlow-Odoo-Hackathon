import { forwardRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const DateRangePicker = forwardRef(function DateRangePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  ariaLabel = "Choose date range",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onBlur,
}, ref) {
  const [open, setOpen] = useState(false);
  const label = value?.from
    ? value.to
      ? `${format(value.from, "dd MMM yyyy")} – ${format(value.to, "dd MMM yyyy")}`
      : format(value.from, "dd MMM yyyy")
    : "Choose date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 justify-start px-3 font-normal", !value?.from && "text-muted-foreground", className)}
          disabled={disabled}
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onBlur={onBlur}
          ref={ref}
        >
          <CalendarDays aria-hidden="true" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          resetOnSelect
          selected={value}
          onSelect={(range) => {
            const nextRange = range ?? { from: undefined, to: undefined };
            onChange(nextRange);
            if (nextRange.from && nextRange.to) {
              setOpen(false);
            }
          }}
          numberOfMonths={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});
