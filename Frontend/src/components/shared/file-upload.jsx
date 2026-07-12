import { useRef, useState } from "react";
import { FileImage, LoaderCircle, Upload, X } from "lucide-react";

import { uploadFile } from "@/api/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const DEFAULT_ACCEPT = [...ALLOWED_TYPES].join(",");

export function FileUpload({
  value,
  onChange,
  folder = "assets",
  disabled = false,
  label = "Upload attachment",
  accept = DEFAULT_ACCEPT,
  onUploadingChange,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  async function handleFile(file) {
    setError(null);
    const allowedTypes = new Set(
      accept
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean),
    );

    if (!allowedTypes.has(file.type)) {
      setError("Choose a supported file type.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Files must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    setProgress(0);

    try {
      const response = await uploadFile(file, folder, (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      onChange(response.data.url);
      setProgress(100);
    } catch (uploadError) {
      setError(uploadError?.message ?? "The file could not be uploaded.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-dashed border-border/80 p-3 transition-colors",
        dragging && "border-primary bg-accent/40",
        (disabled || uploading) && "opacity-70",
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled && !uploading) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && !uploading) event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled || uploading) return;
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
    >
      <Input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        disabled={disabled || uploading}
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.target.value = "";
        }}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 p-3">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            {accept.includes("image/") ? (
              <img
                src={value}
                alt="Uploaded attachment preview"
                className="size-12 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <FileImage className="size-4 shrink-0 text-primary" aria-hidden="true" />
            )}
            <span className="truncate">Attachment uploaded</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            disabled={disabled || uploading}
            aria-label="Remove attachment"
            onClick={() => onChange(null)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-center">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-dashed"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Upload aria-hidden="true" />
            )}
            {uploading ? `Uploading ${progress}%` : label}
          </Button>
          <p className="text-xs text-muted-foreground">
            Drag a file here or use the upload button. Maximum size 5 MB.
          </p>
        </div>
      )}

      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
