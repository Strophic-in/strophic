"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

/** Presign → direct PUT to storage → persist metadata → public URL. */
export async function uploadImage(file: File): Promise<string> {
  const presign = await api.post<{ key: string; uploadUrl: string; publicUrl: string }>(
    "/api/v1/media/presign",
    { filename: file.name, contentType: file.type, size: file.size },
  );
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error("Upload to storage failed (check bucket CORS)");
  await api.post("/api/v1/media", { key: presign.key, contentType: file.type, size: file.size });
  return presign.publicUrl;
}

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}

/**
 * Image picker used across the CMS editors: upload a file straight from the
 * dialog (goes into the Media library) or paste an existing URL.
 */
export function ImageUploadField({ id, label, value, onChange, hint }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {value && (
          <div className="relative shrink-0">
            <img
              src={value}
              alt=""
              className="h-9 w-9 rounded-md border object-cover"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange("")}
              className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full border bg-background text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <Input
          id={id}
          placeholder="https://… or upload →"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onFile(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
