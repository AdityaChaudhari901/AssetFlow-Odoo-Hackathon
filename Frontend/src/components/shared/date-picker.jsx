import { forwardRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const DatePicker = forwardRef(function DatePicker({
  value,
  onChange,
  placeholder = "Choose date",
  disabled = false,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onBlur,
}, ref) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const validSelection = selected && isValid(selected) ? selected : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 w-full justify-start px-3 font-normal", !validSelection && "text-muted-foreground", className)}
          disabled={disabled}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onBlur={onBlur}
          ref={ref}
        >
          <CalendarDays aria-hidden="true" />
          {validSelection ? format(validSelection, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validSelection}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});
