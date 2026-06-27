"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface MediaItem {
  id: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  alt: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

// Presign → direct PUT to storage → persist metadata.
async function uploadFile(file: File): Promise<void> {
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
}

export default function MediaPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => api.getPaginated<MediaItem>("/api/v1/media?pageSize=60"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) await uploadFile(file);
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="text-sm text-muted-foreground">Images used across the site.</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {data?.items.length === 0 && (
        <p className="text-sm text-muted-foreground">No media yet. Upload your first image.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data?.items.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-lg border bg-muted">
            <img
              src={m.url}
              alt={m.alt ?? ""}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <button
              type="button"
              onClick={() => del.mutate(m.id)}
              aria-label="Delete image"
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-background/80 text-destructive opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
