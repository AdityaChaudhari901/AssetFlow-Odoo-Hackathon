import { forwardRef, useState } from "react";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const SearchSelect = forwardRef(function SearchSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  searchValue,
  onSearchChange,
  emptyMessage = "No matching options.",
  disabled = false,
  loading = false,
  ariaLabel,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onBlur,
}, ref) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn("h-11 w-full justify-between px-3 font-normal", !selected && "text-muted-foreground", className)}
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onBlur={onBlur}
          ref={ref}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          {loading ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={!onSearchChange}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.keywords ?? ""}`}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", value === option.value ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
