"use client";

import { slugify } from "@strophic/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { arrayToLines, linesToArray } from "@/lib/form-helpers";
import { PRODUCT_STATUSES, type Product, type ProductStatus } from "@/lib/types";

interface FormState {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  url: string;
  logoImage: string;
  pricing: string;
  features: string;
  accentFrom: string;
  accentTo: string;
  content: string;
  order: string;
  featured: boolean;
  published: boolean;
}

const emptyForm: FormState = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  status: "BETA",
  url: "",
  logoImage: "",
  pricing: "",
  features: "",
  accentFrom: "#7c5cff",
  accentTo: "#3d2689",
  content: "",
  order: "0",
  featured: false,
  published: true,
};

function toForm(p: Product): FormState {
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    status: p.status,
    url: p.url ?? "",
    logoImage: p.logoImage ?? "",
    pricing: p.pricing,
    features: arrayToLines(p.features),
    accentFrom: p.accentFrom,
    accentTo: p.accentTo,
    content: p.content ?? "",
    order: p.order.toString(),
    featured: p.featured,
    published: p.published,
  };
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => api.getPaginated<Product>("/api/v1/admin/products?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSlugLocked(false);
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm(toForm(p));
    setSlugLocked(true);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        slug: form.slug || slugify(form.name),
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        status: form.status,
        url: form.url || undefined,
        logoImage: form.logoImage || undefined,
        pricing: form.pricing,
        features: linesToArray(form.features),
        accentFrom: form.accentFrom,
        accentTo: form.accentTo,
        content: form.content || undefined,
        order: Number(form.order) || 0,
        featured: form.featured,
        published: form.published,
      };
      return editing
        ? api.patch(`/api/v1/admin/products/${editing.id}`, payload)
        : api.post("/api/v1/admin/products", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(editing ? "Product updated" : "Product created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Micro-SaaS</h1>
          <p className="text-sm text-muted-foreground">Strophic&apos;s own products.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New product
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Pricing</TableHead>
              <TableHead>Stage</TableHead>
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
                  No products yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.tagline}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {p.pricing}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{p.status}</Badge>
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
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: slugLocked ? f.slug : slugify(name) }));
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
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Stage</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pricing">Pricing</Label>
                <Input
                  id="pricing"
                  value={form.pricing}
                  onChange={(e) => setForm({ ...form, pricing: e.target.value })}
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
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                rows={3}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
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
              id="logoImage"
              label="Product logo"
              value={form.logoImage}
              onChange={(logoImage) => setForm((f) => ({ ...f, logoImage }))}
              hint="Square logo - replaces the letter avatar on the website when set."
            />
            <div className="grid gap-2">
              <Label htmlFor="content">Detail body (Markdown, optional)</Label>
              <Textarea
                id="content"
                rows={5}
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
              disabled={save.isPending || !form.name || !form.tagline}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
