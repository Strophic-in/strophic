"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
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
import type { Testimonial } from "@/lib/types";

interface FormState {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: string;
  order: string;
  featured: boolean;
  published: boolean;
}

const emptyForm: FormState = {
  quote: "",
  author: "",
  role: "",
  company: "",
  rating: "",
  order: "0",
  featured: false,
  published: true,
};

function toForm(t: Testimonial): FormState {
  return {
    quote: t.quote,
    author: t.author,
    role: t.role,
    company: t.company,
    rating: t.rating?.toString() ?? "",
    order: t.order.toString(),
    featured: t.featured,
    published: t.published,
  };
}

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["testimonials", "admin"],
    queryFn: () => api.getPaginated<Testimonial>("/api/v1/admin/testimonials?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm(toForm(t));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        quote: form.quote,
        author: form.author,
        role: form.role,
        company: form.company,
        rating: form.rating ? Number(form.rating) : undefined,
        order: Number(form.order) || 0,
        featured: form.featured,
        published: form.published,
      };
      return editing
        ? api.patch(`/api/v1/admin/testimonials/${editing.id}`, payload)
        : api.post("/api/v1/admin/testimonials", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success(editing ? "Testimonial updated" : "Testimonial added");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/testimonials/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="text-sm text-muted-foreground">Social proof shown across the site.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add testimonial
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote</TableHead>
              <TableHead className="hidden sm:table-cell">Author</TableHead>
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
                  No testimonials yet. Add your first one.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((t) => (
              <TableRow
                key={t.id}
                className="cursor-pointer"
                onClick={() => openEdit(t)}
              >
                <TableCell className="max-w-md">
                  <div className="flex items-center gap-2">
                    {t.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                    <span className="line-clamp-2 text-sm">{t.quote}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm sm:table-cell">
                  <div className="font-medium">{t.author}</div>
                  <div className="text-muted-foreground">
                    {t.role}, {t.company}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={t.published ? "default" : "secondary"}>
                    {t.published ? "published" : "hidden"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={del.isPending}
                    onClick={() => del.mutate(t.id)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit testimonial" : "Add testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                rows={4}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={1}
                    max={5}
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
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
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Featured on homepage
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
              disabled={save.isPending || !form.quote || !form.author}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
