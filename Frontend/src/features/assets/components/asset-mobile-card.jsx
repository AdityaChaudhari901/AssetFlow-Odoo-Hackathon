import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AssetThumbnail } from "@/features/assets/components/asset-thumbnail";

export function AssetMobileCard({ asset, onOpen }) {
  return (
    <Card
      className="border border-border/80 ring-0"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardContent className="space-y-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <AssetThumbnail asset={asset} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold tabular-nums text-primary">{asset.asset_tag}</p>
              <p className="truncate text-sm font-semibold">{asset.name}</p>
              <p className="truncate text-xs text-muted-foreground">{asset.category?.name ?? "Uncategorized"}</p>
            </div>
          </div>
          <StatusBadge kind="asset" value={asset.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-xs">
          <div>
            <p className="text-muted-foreground">Current holder</p>
            <p className="mt-1 truncate font-medium">{asset.current_holder?.name ?? "Available pool"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Condition</p>
            <div className="mt-1"><StatusBadge kind="condition" value={asset.condition} /></div>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          <span className="truncate">{asset.location || "Location not recorded"}</span>
        </p>
      </CardContent>
    </Card>
  );
}
