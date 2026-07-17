"use client";

import { slugify } from "@strophic/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Star } from "lucide-react";
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
import { ImageUploadField } from "@/components/image-upload-field";
import { api } from "@/lib/api";
import { arrayToCsv, arrayToLines, csvToArray, linesToArray } from "@/lib/form-helpers";
import type { Project } from "@/lib/types";

interface FormState {
  slug: string;
  title: string;
  summary: string;
  category: string;
  year: string;
  tags: string;
  results: string;
  accentFrom: string;
  accentTo: string;
  coverImage: string;
  logoImage: string;
  url: string;
  content: string;
  order: string;
  featured: boolean;
  published: boolean;
}

const emptyForm: FormState = {
  slug: "",
  title: "",
  summary: "",
  category: "",
  year: new Date().getFullYear().toString(),
  tags: "",
  results: "",
  accentFrom: "#7c5cff",
  accentTo: "#3d2689",
  coverImage: "",
  logoImage: "",
  url: "",
  content: "",
  order: "0",
  featured: false,
  published: true,
};

function toForm(p: Project): FormState {
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    category: p.category,
    year: p.year,
    tags: arrayToCsv(p.tags),
    results: arrayToLines(p.results),
    accentFrom: p.accentFrom,
    accentTo: p.accentTo,
    coverImage: p.coverImage ?? "",
    logoImage: p.logoImage ?? "",
    url: p.url ?? "",
    content: p.content ?? "",
    order: p.order.toString(),
    featured: p.featured,
    published: p.published,
  };
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["projects", "admin"],
    queryFn: () => api.getPaginated<Project>("/api/v1/admin/projects?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSlugLocked(false);
    setOpen(true);
  }
  function openEdit(p: Project) {
    setEditing(p);
    setForm(toForm(p));
    setSlugLocked(true);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        slug: form.slug || slugify(form.title),
        title: form.title,
        summary: form.summary,
        category: form.category,
        year: form.year,
        tags: csvToArray(form.tags),
        results: linesToArray(form.results),
        accentFrom: form.accentFrom,
        accentTo: form.accentTo,
        coverImage: form.coverImage || undefined,
        logoImage: form.logoImage || undefined,
        url: form.url || undefined,
        content: form.content || undefined,
        order: Number(form.order) || 0,
        featured: form.featured,
        published: form.published,
      };
      return editing
        ? api.patch(`/api/v1/admin/projects/${editing.id}`, payload)
        : api.post("/api/v1/admin/projects", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(editing ? "Project updated" : "Project created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Case studies &amp; client projects.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                    {p.logoImage && (
                      <img
                        src={p.logoImage}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-md border object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.title}
                          </a>
                        ) : (
                          p.title
                        )}
                        {p.url && <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />}
                      </div>
                      <div className="text-sm text-muted-foreground">/{p.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {p.category}
                </TableCell>
                <TableCell>
                  <Badge variant={p.published ? "default" : "secondary"}>
                    {p.published ? "published" : "hidden"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={del.isPending}
                    onClick={() => del.mutate(p.id)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      slug: slugLocked ? f.slug : slugify(title),
                    }));
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugLocked(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={2}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
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
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="results">Results (one per line)</Label>
              <Textarea
                id="results"
                rows={3}
                value={form.results}
                onChange={(e) => setForm({ ...form, results: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="accentFrom">Accent from</Label>
                <Input
                  id="accentFrom"
                  value={form.accentFrom}
                  onChange={(e) => setForm({ ...form, accentFrom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accentTo">Accent to</Label>
                <Input
                  id="accentTo"
                  value={form.accentTo}
                  onChange={(e) => setForm({ ...form, accentTo: e.target.value })}
                />
              </div>
            </div>
            <ImageUploadField
              id="coverImage"
              label="Project image"
              value={form.coverImage}
              onChange={(coverImage) => setForm((f) => ({ ...f, coverImage }))}
              hint="Shown as the card/hero image on the website."
            />
            <ImageUploadField
              id="logoImage"
              label="Project logo"
              value={form.logoImage}
              onChange={(logoImage) => setForm((f) => ({ ...f, logoImage }))}
              hint="Small square logo shown next to the project name."
            />
            <div className="grid gap-2">
              <Label htmlFor="url">Live project URL</Label>
              <Input
                id="url"
                placeholder="https://myproject.com"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                On the website, clicking the project name opens this URL.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Case study body (Markdown, optional)</Label>
              <Textarea
                id="content"
                rows={6}
                className="font-mono text-sm"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Published
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || !form.title || !form.summary}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
