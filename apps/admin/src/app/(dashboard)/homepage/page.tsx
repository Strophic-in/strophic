"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { HomepageSection } from "@/lib/types";
import { HOMEPAGE_SECTIONS, getHomepageSectionDef } from "@strophic/utils";

interface FormState {
  key: string;
  title: string;
  subtitle: string;
  order: string;
  enabled: boolean;
  configText: string;
}

const emptyForm: FormState = {
  key: "",
  title: "",
  subtitle: "",
  order: "0",
  enabled: true,
  configText: "{}",
};

function toForm(s: HomepageSection): FormState {
  return {
    key: s.key,
    title: s.title ?? "",
    subtitle: s.subtitle ?? "",
    order: s.order.toString(),
    enabled: s.enabled,
    configText: JSON.stringify(s.config ?? {}, null, 2),
  };
}

export default function HomepagePage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["homepage", "admin"],
    queryFn: () => api.get<{ items: HomepageSection[] }>("/api/v1/admin/homepage"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HomepageSection | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(s: HomepageSection) {
    setEditing(s);
    setForm(toForm(s));
    setOpen(true);
  }

  // Picking a known section also seeds its sample config - unless the user has
  // already typed their own.
  function selectKey(key: string) {
    const def = getHomepageSectionDef(key);
    setForm((f) => ({
      ...f,
      key,
      configText:
        !f.configText.trim() || f.configText.trim() === "{}"
          ? JSON.stringify(def?.sampleConfig ?? {}, null, 2)
          : f.configText,
    }));
  }

  const save = useMutation({
    mutationFn: () => {
      let config: Record<string, unknown>;
      try {
        config = form.configText.trim() ? JSON.parse(form.configText) : {};
      } catch {
        throw new Error("Config must be valid JSON");
      }
      if (editing) {
        return api.patch(`/api/v1/admin/homepage/${editing.id}`, {
          title: form.title || undefined,
          subtitle: form.subtitle || undefined,
          order: Number(form.order) || 0,
          enabled: form.enabled,
          config,
        });
      }
      // Create-or-update by key.
      return api.put("/api/v1/admin/homepage", {
        key: form.key,
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        order: Number(form.order) || 0,
        enabled: form.enabled,
        config,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage"] });
      toast.success(editing ? "Section updated" : "Section saved");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/homepage/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage"] });
      toast.success("Section deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const selectedDef = getHomepageSectionDef(form.key);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
          <p className="text-sm text-muted-foreground">
            Customize each homepage block - override its heading/copy, set options, or hide it.
            Changes go live on the next site rebuild.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New section
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="hidden sm:table-cell">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No sections yet. Add one to make the homepage editable.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => openEdit(s)}>
                <TableCell className="text-sm text-muted-foreground">{s.order}</TableCell>
                <TableCell className="font-mono text-sm">{s.key}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {s.title ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={s.enabled ? "default" : "secondary"}>
                    {s.enabled ? "enabled" : "disabled"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={del.isPending}
                    onClick={() => del.mutate(s.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit section" : "New section"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-[2fr_1fr] gap-4">
              <div className="grid gap-2">
                <Label htmlFor="key">Section</Label>
                {editing ? (
                  <Input id="key" value={form.key} disabled />
                ) : (
                  <select
                    id="key"
                    value={form.key}
                    onChange={(e) => selectKey(e.target.value)}
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  >
                    <option value="" disabled>
                      Choose a section…
                    </option>
                    {HOMEPAGE_SECTIONS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
            </div>
            {selectedDef && (
              <p className="-mt-1 text-xs text-muted-foreground">{selectedDef.description}</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title
                {selectedDef?.title && (
                  <span className="ml-2 font-normal text-muted-foreground">{selectedDef.title}</span>
                )}
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subtitle">
                Subtitle
                {selectedDef?.subtitle && (
                  <span className="ml-2 font-normal text-muted-foreground">{selectedDef.subtitle}</span>
                )}
              </Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config">Config (JSON)</Label>
              <Textarea
                id="config"
                rows={6}
                className="font-mono text-sm"
                value={form.configText}
                onChange={(e) => setForm({ ...form, configText: e.target.value })}
              />
              {selectedDef &&
                (selectedDef.config.length > 0 ? (
                  <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Config options</p>
                    <ul className="mt-1 space-y-1">
                      {selectedDef.config.map((f) => (
                        <li key={f.name}>
                          <code className="font-mono text-foreground">{f.name}</code> - {f.description}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-2 underline underline-offset-2 hover:text-foreground"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          configText: JSON.stringify(selectedDef.sampleConfig, null, 2),
                        }))
                      }
                    >
                      Insert sample config
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This section takes no config options - leave it as {"{}"}.
                  </p>
                ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              Enabled
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || (!editing && !form.key)}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
