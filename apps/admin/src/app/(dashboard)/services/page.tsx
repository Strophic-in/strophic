"use client";

import { slugify } from "@strophic/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Trash2 } from "lucide-react";
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
import { arrayToLines, linesToArray } from "@/lib/form-helpers";
import type { Service, ServiceFaq, ServiceWorkflowStep } from "@/lib/types";

interface FormState {
  slug: string;
  icon: string;
  title: string;
  summary: string;
  description: string;
  benefits: string;
  stack: string;
  workflow: ServiceWorkflowStep[];
  faqs: ServiceFaq[];
  order: string;
  featured: boolean;
  published: boolean;
}

const emptyForm: FormState = {
  slug: "",
  icon: "sparkles",
  title: "",
  summary: "",
  description: "",
  benefits: "",
  stack: "",
  workflow: [],
  faqs: [],
  order: "0",
  featured: false,
  published: true,
};

function toForm(s: Service): FormState {
  return {
    slug: s.slug,
    icon: s.icon,
    title: s.title,
    summary: s.summary,
    description: s.description,
    benefits: arrayToLines(s.benefits),
    stack: arrayToLines(s.stack),
    workflow: s.workflow ?? [],
    faqs: s.faqs ?? [],
    order: s.order.toString(),
    featured: s.featured,
    published: s.published,
  };
}

export default function ServicesPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["services", "admin"],
    queryFn: () => api.getPaginated<Service>("/api/v1/admin/services?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSlugLocked(false);
    setOpen(true);
  }
  function openEdit(s: Service) {
    setEditing(s);
    setForm(toForm(s));
    setSlugLocked(true);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        slug: form.slug || slugify(form.title),
        icon: form.icon || "sparkles",
        title: form.title,
        summary: form.summary,
        description: form.description,
        benefits: linesToArray(form.benefits),
        stack: linesToArray(form.stack),
        workflow: form.workflow.filter((w) => w.title.trim()),
        faqs: form.faqs.filter((f) => f.question.trim()),
        order: Number(form.order) || 0,
        featured: form.featured,
        published: form.published,
      };
      return editing
        ? api.patch(`/api/v1/admin/services/${editing.id}`, payload)
        : api.post("/api/v1/admin/services", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(editing ? "Service updated" : "Service created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">What Strophic offers.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New service
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
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
                  No services yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => openEdit(s)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {s.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="line-clamp-1 text-sm text-muted-foreground">{s.summary}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  /{s.slug}
                </TableCell>
                <TableCell>
                  <Badge variant={s.published ? "default" : "secondary"}>
                    {s.published ? "published" : "hidden"}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "New service"}</DialogTitle>
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
                    setForm((f) => ({ ...f, title, slug: slugLocked ? f.slug : slugify(title) }));
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
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  rows={4}
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stack">Stack (one per line)</Label>
                <Textarea
                  id="stack"
                  rows={4}
                  value={form.stack}
                  onChange={(e) => setForm({ ...form, stack: e.target.value })}
                />
              </div>
            </div>

            {/* Workflow repeater */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Workflow steps</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, workflow: [...f.workflow, { title: "", description: "" }] }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Step
                </Button>
              </div>
              {form.workflow.map((step, i) => (
                <div key={i} className="flex gap-2 rounded-md border p-2">
                  <div className="grid flex-1 gap-2">
                    <Input
                      placeholder="Step title"
                      value={step.title}
                      onChange={(e) =>
                        setForm((f) => {
                          const workflow = [...f.workflow];
                          workflow[i] = { ...workflow[i]!, title: e.target.value };
                          return { ...f, workflow };
                        })
                      }
                    />
                    <Textarea
                      placeholder="Step description"
                      rows={2}
                      value={step.description}
                      onChange={(e) =>
                        setForm((f) => {
                          const workflow = [...f.workflow];
                          workflow[i] = { ...workflow[i]!, description: e.target.value };
                          return { ...f, workflow };
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove step"
                    onClick={() =>
                      setForm((f) => ({ ...f, workflow: f.workflow.filter((_, j) => j !== i) }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* FAQ repeater */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>FAQs</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, faqs: [...f.faqs, { question: "", answer: "" }] }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> FAQ
                </Button>
              </div>
              {form.faqs.map((faq, i) => (
                <div key={i} className="flex gap-2 rounded-md border p-2">
                  <div className="grid flex-1 gap-2">
                    <Input
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) =>
                        setForm((f) => {
                          const faqs = [...f.faqs];
                          faqs[i] = { ...faqs[i]!, question: e.target.value };
                          return { ...f, faqs };
                        })
                      }
                    />
                    <Textarea
                      placeholder="Answer"
                      rows={2}
                      value={faq.answer}
                      onChange={(e) =>
                        setForm((f) => {
                          const faqs = [...f.faqs];
                          faqs[i] = { ...faqs[i]!, answer: e.target.value };
                          return { ...f, faqs };
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove FAQ"
                    onClick={() => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, j) => j !== i) }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] items-end gap-4">
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
              <label className="flex items-center gap-2 pb-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 pb-2.5 text-sm">
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
              disabled={save.isPending || !form.title || !form.summary || !form.description}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
