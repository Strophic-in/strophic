"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
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
import type { TeamMember } from "@/lib/types";

interface LinkRow {
  key: string;
  url: string;
}
interface FormState {
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  links: LinkRow[];
  order: string;
  published: boolean;
}

const emptyForm: FormState = {
  name: "",
  role: "",
  bio: "",
  avatarUrl: "",
  links: [],
  order: "0",
  published: true,
};

function toForm(m: TeamMember): FormState {
  return {
    name: m.name,
    role: m.role,
    bio: m.bio ?? "",
    avatarUrl: m.avatarUrl ?? "",
    links: Object.entries(m.links ?? {}).map(([key, url]) => ({ key, url })),
    order: m.order.toString(),
    published: m.published,
  };
}

export default function TeamPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["team", "admin"],
    queryFn: () => api.getPaginated<TeamMember>("/api/v1/admin/team?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(m: TeamMember) {
    setEditing(m);
    setForm(toForm(m));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const links: Record<string, string> = {};
      for (const { key, url } of form.links) {
        if (key.trim() && url.trim()) links[key.trim()] = url.trim();
      }
      const payload = {
        name: form.name,
        role: form.role,
        bio: form.bio || undefined,
        avatarUrl: form.avatarUrl || undefined,
        links,
        order: Number(form.order) || 0,
        published: form.published,
      };
      return editing
        ? api.patch(`/api/v1/admin/team/${editing.id}`, payload)
        : api.post("/api/v1/admin/team", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success(editing ? "Member updated" : "Member added");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/team/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Member deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">People behind Strophic.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
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
                  No team members yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => openEdit(m)}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {m.role}
                </TableCell>
                <TableCell>
                  <Badge variant={m.published ? "default" : "secondary"}>
                    {m.published ? "published" : "hidden"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={del.isPending}
                    onClick={() => del.mutate(m.id)}
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
            <DialogTitle>{editing ? "Edit member" : "Add member"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={form.avatarUrl}
                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, links: [...f.links, { key: "", url: "" }] }))}
                >
                  <Plus className="h-3.5 w-3.5" /> Link
                </Button>
              </div>
              {form.links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="label (e.g. github)"
                    className="w-1/3"
                    value={link.key}
                    onChange={(e) =>
                      setForm((f) => {
                        const links = [...f.links];
                        links[i] = { ...links[i]!, key: e.target.value };
                        return { ...f, links };
                      })
                    }
                  />
                  <Input
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) =>
                      setForm((f) => {
                        const links = [...f.links];
                        links[i] = { ...links[i]!, url: e.target.value };
                        return { ...f, links };
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove link"
                    onClick={() => setForm((f) => ({ ...f, links: f.links.filter((_, j) => j !== i) }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid w-32 gap-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
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
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.role}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
