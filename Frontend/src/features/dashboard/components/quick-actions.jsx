import { CalendarPlus, PackagePlus, Wrench } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { APP_ROLES } from "@/lib/constants";

export function QuickActions({ user }) {
  const canRegister = [APP_ROLES.ADMIN, APP_ROLES.ASSET_MANAGER].includes(user?.role);
  return (
    <section className="rounded-xl border border-border/80 bg-card p-5" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="font-semibold">Quick actions</h2>
      <p className="mt-1 text-sm text-muted-foreground">Start the next accountable workflow.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {canRegister ? <Button asChild variant="outline" className="h-11 justify-start"><Link to="/assets?register=true"><PackagePlus aria-hidden="true" />Register asset</Link></Button> : null}
        <Button asChild variant="outline" className="h-11 justify-start"><Link to="/bookings?action=book"><CalendarPlus aria-hidden="true" />Book resource</Link></Button>
        <Button asChild variant="outline" className="h-11 justify-start"><Link to="/maintenance?create=true"><Wrench aria-hidden="true" />Raise maintenance</Link></Button>
      </div>
    </section>
  );
}
