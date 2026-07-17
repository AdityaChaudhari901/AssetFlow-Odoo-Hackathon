import { cn } from "@/lib/utils";

export function OdooLogo({ className, alt = "Odoo" }) {
  return (
    <>
      <img
        src="/logos/odoo_logo%20.png"
        alt={alt}
        width="621"
        height="196"
        className={cn("w-auto dark:hidden", className)}
      />
      <img
        src="/logos/odoo_logo_inverted.png"
        alt=""
        width="621"
        height="196"
        className={cn("hidden w-auto dark:block", className)}
        aria-hidden="true"
      />
    </>
  );
}

export function OdooBrand({ className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
      aria-label="Built with Odoo"
    >
      <span>Built with</span>
      <OdooLogo className="h-4.5" />
    </div>
  );
}
