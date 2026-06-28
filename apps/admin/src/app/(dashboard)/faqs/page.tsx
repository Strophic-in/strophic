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
import type { Faq } from "@/lib/types";

interface FormState {
  question: string;
  answer: string;
  category: string;
  order: string;
  published: boolean;
}

const emptyForm: FormState = {
  question: "",
  answer: "",
  category: "",
  order: "0",
  published: true,
};

function toForm(f: Faq): FormState {
  return {
    question: f.question,
    answer: f.answer,
    category: f.category ?? "",
    order: f.order.toString(),
    published: f.published,
  };
}

export default function FaqsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["faqs", "admin"],
    queryFn: () => api.getPaginated<Faq>("/api/v1/admin/faqs?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(f: Faq) {
    setEditing(f);
    setForm(toForm(f));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        question: form.question,
        answer: form.answer,
        category: form.category || undefined,
        order: Number(form.order) || 0,
        published: form.published,
      };
      return editing
        ? api.patch(`/api/v1/admin/faqs/${editing.id}`, payload)
        : api.post("/api/v1/admin/faqs", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success(editing ? "FAQ updated" : "FAQ added");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/faqs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
          <p className="text-sm text-muted-foreground">
            Answer common questions to remove friction before contact.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
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
                  No FAQs yet. Add your first one.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((f) => (
              <TableRow key={f.id} className="cursor-pointer" onClick={() => openEdit(f)}>
                <TableCell className="max-w-md">
                  <div className="font-medium">{f.question}</div>
                  <div className="line-clamp-1 text-sm text-muted-foreground">{f.answer}</div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {f.category ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={f.published ? "default" : "secondary"}>
                    {f.published ? "published" : "hidden"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={del.isPending}
                    onClick={() => del.mutate(f.id)}
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
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                rows={5}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || !form.question || !form.answer}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
