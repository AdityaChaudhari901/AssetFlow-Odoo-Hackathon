import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "size-10 rounded-lg",
  md: "size-14 rounded-xl",
  lg: "size-20 rounded-xl",
};

export function AssetThumbnail({
  asset,
  size = "md",
  decorative = true,
  className,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [asset?.image_url]);

  const classes = cn(
    "grid shrink-0 place-items-center overflow-hidden border border-border bg-muted/30 text-primary",
    SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
    className,
  );

  if (asset?.image_url && !failed) {
    return (
      <span className={classes}>
        <img
          src={asset.image_url}
          alt={decorative ? "" : `${asset.name} asset`}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden={decorative ? "true" : undefined}>
      <Package className="size-5" aria-hidden="true" />
      {!decorative ? <span className="sr-only">No asset image</span> : null}
    </span>
  );
}
